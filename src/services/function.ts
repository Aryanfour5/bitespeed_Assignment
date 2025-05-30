import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../utils/error';

const prisma = new PrismaClient();

export async function softDeleteContact(id: string) {
  const contactId = parseInt(id, 10);
  if (isNaN(contactId)) {
    throw new ValidationError('Invalid contact ID');
  }

  const existingContact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!existingContact) {
    throw new ValidationError(`Contact with ID ${id} not found`);
  }

  if (existingContact.deletedAt) {
    throw new ValidationError(`Contact with ID ${id} is already deleted`);
  }

  const deletedContact = await prisma.contact.update({
    where: { id: contactId },
    data: { deletedAt: new Date() },
  });

  return deletedContact;
}
export async function restoreContact(id: string) {
  const contactId = parseInt(id, 10);
  if (isNaN(contactId)) {
    throw new ValidationError('Invalid contact ID');
  }

  const existingContact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!existingContact) {
    throw new ValidationError(`Contact with ID ${id} not found`);
  }

  if (!existingContact.deletedAt) {
    throw new ValidationError(`Contact with ID ${id} is not deleted`);
  }

  const restoredContact = await prisma.contact.update({
    where: { id: contactId },
    data: { deletedAt: null },
  });

  return restoredContact;
}
