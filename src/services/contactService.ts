import { PrismaClient, Contact, LinkPrecedence } from '@prisma/client';

const prisma = new PrismaClient();

interface IdentifyResult {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export async function identifyContact(
  email?: string,
  phoneNumber?: string
): Promise<IdentifyResult> {
  // Validate input - at least one of email or phoneNumber must be provided
  if (!email && !phoneNumber) {
    throw new Error('At least one of email or phoneNumber must be provided');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Find all contacts matching email or phoneNumber (excluding deleted)
    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phoneNumber });

    const initialContacts = await tx.contact.findMany({
      where: {
        deletedAt: null,
        OR: whereConditions
      },
      orderBy: { createdAt: 'asc' }
    });

    if (initialContacts.length === 0) {
      // No existing contacts, create new primary contact
      const newContact = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: LinkPrecedence.primary,
        },
      });

      return {
        primaryContactId: newContact.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      };
    }

    // 2. Find all contacts in the same contact groups
    const allGroupContacts = await findAllRelatedContacts(tx, initialContacts);

    // 3. Find all primary contacts and determine the oldest one
    const primaryContacts = allGroupContacts
      .filter(c => c.linkPrecedence === LinkPrecedence.primary)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (primaryContacts.length === 0) {
      throw new Error('No primary contact found in the contact group');
    }

    const oldestPrimary = primaryContacts[0];

    // 4. Collect existing emails and phone numbers
    const existingEmails = new Set<string>();
    const existingPhoneNumbers = new Set<string>();
    const currentSecondaryIds: number[] = [];

    allGroupContacts.forEach(contact => {
      if (contact.email) existingEmails.add(contact.email);
      if (contact.phoneNumber) existingPhoneNumbers.add(contact.phoneNumber);
      if (contact.linkPrecedence === LinkPrecedence.secondary) {
        currentSecondaryIds.push(contact.id);
      }
    });

    // 5. Check if we need to create a new secondary contact
    const emailIsNew = email && !existingEmails.has(email);
    const phoneIsNew = phoneNumber && !existingPhoneNumbers.has(phoneNumber);
    
    if (emailIsNew || phoneIsNew) {
      const newSecondaryContact = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: oldestPrimary.id,
          linkPrecedence: LinkPrecedence.secondary,
        },
      });
      
      currentSecondaryIds.push(newSecondaryContact.id);
      if (email) existingEmails.add(email);
      if (phoneNumber) existingPhoneNumbers.add(phoneNumber);
    }

    // 6. Convert additional primary contacts to secondary
    if (primaryContacts.length > 1) {
      const contactsToConvert = primaryContacts.slice(1);
      
      for (const contact of contactsToConvert) {
        await tx.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: LinkPrecedence.secondary,
            linkedId: oldestPrimary.id,
          },
        });
        currentSecondaryIds.push(contact.id);
      }

      // Also need to update any contacts that were linked to the converted primaries
      const contactsLinkedToConverted = allGroupContacts.filter(c => 
        c.linkPrecedence === LinkPrecedence.secondary && 
        contactsToConvert.some(converted => converted.id === c.linkedId)
      );

      for (const linkedContact of contactsLinkedToConverted) {
        await tx.contact.update({
          where: { id: linkedContact.id },
          data: { linkedId: oldestPrimary.id },
        });
      }
    }

    return {
      primaryContactId: oldestPrimary.id,
      emails: Array.from(existingEmails).sort(),
      phoneNumbers: Array.from(existingPhoneNumbers).sort(),
      secondaryContactIds: currentSecondaryIds.sort((a, b) => a - b),
    };
  });
}

/**
 * Recursively finds all contacts related to the initial set of contacts
 */
async function findAllRelatedContacts(
  tx: any, 
  initialContacts: Contact[]
): Promise<Contact[]> {
  const visitedIds = new Set<number>();
  const allContacts: Contact[] = [];

  // Queue for BFS traversal
  const queue = [...initialContacts];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visitedIds.has(current.id)) {
      continue;
    }
    
    visitedIds.add(current.id);
    allContacts.push(current);

    // Find contacts linked to this one (if this is primary)
    const linkedContacts = await tx.contact.findMany({
      where: {
        deletedAt: null,
        linkedId: current.id
      }
    });

    // Find the contact this one is linked to (if this is secondary)
    let parentContact: Contact | null = null;
    if (current.linkedId && !visitedIds.has(current.linkedId)) {
      parentContact = await tx.contact.findUnique({
        where: {
          id: current.linkedId,
          deletedAt: null
        }
      });
    }

    // Add newly found contacts to queue
    for (const contact of linkedContacts) {
      if (!visitedIds.has(contact.id)) {
        queue.push(contact);
      }
    }

    if (parentContact && !visitedIds.has(parentContact.id)) {
      queue.push(parentContact);
    }
  }

  return allContacts;
}