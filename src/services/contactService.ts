import { PrismaClient, Prisma } from '@prisma/client';
import { ValidationError } from '../utils/error';

const prisma = new PrismaClient();
type Contact = Prisma.ContactGetPayload<{}>;
type LinkPrecedence = import('@prisma/client').LinkPrecedence;
type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

interface IdentifyResult {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

// Validation Functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneNumber(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);  // Indian 10-digit mobile numbers
}

export async function identifyContact(
  email?: string,
  phoneNumber?: string
): Promise<IdentifyResult> {
  // Validate input
  if (!email && !phoneNumber) {
    throw new ValidationError('At least one of email or phoneNumber must be provided');
  }
  if (email && !isValidEmail(email)) {
    throw new ValidationError(`Invalid email format: ${email}`);
  }
  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    throw new ValidationError(`Invalid phone number format: ${phoneNumber}`);
  }

  return await prisma.$transaction(async (tx) => {
    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phoneNumber });

    const initialContacts = await tx.contact.findMany({
      where: { deletedAt: null, OR: whereConditions },
      orderBy: { createdAt: 'asc' },
    });

    if (initialContacts.length === 0) {
      const newContact = await tx.contact.create({
        data: { email, phoneNumber, linkPrecedence: 'primary' as LinkPrecedence },
      });

      return {
        primaryContactId: newContact.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      };
    }

    const allGroupContacts = await findAllRelatedContacts(tx, initialContacts);

    const primaryContacts = allGroupContacts
      .filter(c => c.linkPrecedence === 'primary')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (primaryContacts.length === 0) {
      throw new Error('No primary contact found in the contact group');
    }

    const oldestPrimary = primaryContacts[0];
    const existingEmails = new Set<string>();
    const existingPhoneNumbers = new Set<string>();
    const currentSecondaryIds: number[] = [];

    allGroupContacts.forEach(contact => {
      if (contact.email) existingEmails.add(contact.email);
      if (contact.phoneNumber) existingPhoneNumbers.add(contact.phoneNumber);
      if (contact.linkPrecedence === 'secondary') currentSecondaryIds.push(contact.id);
    });

    const emailIsNew = email && !existingEmails.has(email);
    const phoneIsNew = phoneNumber && !existingPhoneNumbers.has(phoneNumber);

    if (emailIsNew || phoneIsNew) {
      const newSecondaryContact = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: oldestPrimary.id,
          linkPrecedence: 'secondary' as LinkPrecedence,
        },
      });
      currentSecondaryIds.push(newSecondaryContact.id);
      if (email) existingEmails.add(email);
      if (phoneNumber) existingPhoneNumbers.add(phoneNumber);
    }

    if (primaryContacts.length > 1) {
      const contactsToConvert = primaryContacts.slice(1);
      for (const contact of contactsToConvert) {
        await tx.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: 'secondary' as LinkPrecedence,
            linkedId: oldestPrimary.id,
          },
        });
        currentSecondaryIds.push(contact.id);
      }

      const contactsLinkedToConverted = allGroupContacts.filter(c =>
        c.linkPrecedence === 'secondary' &&
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

async function findAllRelatedContacts(
  tx: TransactionClient,
  initialContacts: Contact[]
): Promise<Contact[]> {
  const visitedIds = new Set<number>();
  const allContacts: Contact[] = [];
  const queue = [...initialContacts];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visitedIds.has(current.id)) continue;

    visitedIds.add(current.id);
    allContacts.push(current);

    const linkedContacts = await tx.contact.findMany({
      where: { deletedAt: null, linkedId: current.id }
    });

    let parentContact: Contact | null = null;
    if (current.linkedId && !visitedIds.has(current.linkedId)) {
      parentContact = await tx.contact.findUnique({
        where: { id: current.linkedId, deletedAt: null }
      });
    }

    for (const contact of linkedContacts) {
      if (!visitedIds.has(contact.id)) queue.push(contact);
    }

    if (parentContact && !visitedIds.has(parentContact.id)) {
      queue.push(parentContact);
    }
  }

  return allContacts;
}
