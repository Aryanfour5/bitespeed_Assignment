import express, { Request, Response } from 'express';
import { identifyContact } from '../services/contactService';
import { ValidationError } from '../utils/error';
import { softDeleteContact, restoreContact } from '../services/function';

const router = express.Router();

/**
 * @openapi
 * /identify:
 *   post:
 *     summary: Identify contact and link records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: Contact matched or created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contact:
 *                   type: object
 *                   properties:
 *                     primaryContactId:
 *                       type: integer
 *                       example: 11
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["john.doe@example.com", "newuser@example.com"]
 *                     phoneNumbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["9876543210", "9876543110"]
 *                     secondaryContactIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [12, 17]
 */

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({ error: 'email or phoneNumber required' });
      return;
    }

    const contact = await identifyContact(email, phoneNumber);
    res.json({ contact });

  } catch (err: any) {
    console.error(err);
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
/**
 * @openapi
 * /identify/{id}:
 *   delete:
 *     summary: Soft delete a contact
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact soft deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contact soft deleted
 *                 contact:
 *                   $ref: '#/components/schemas/Contact'
 */

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedContact = await softDeleteContact(id);
    res.json({ message: 'Contact soft deleted', contact: updatedContact });
  } catch (err: any) {
    console.error(err);
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
/**
 * @openapi
 * /identify/restore/{id}:
 *   patch:
 *     summary: Restore a soft-deleted contact
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact restored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contact restored
 *                 contact:
 *                   $ref: '#/components/schemas/Contact'
 */

router.patch('/restore/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const restoredContact = await restoreContact(id);
    res.json({ message: 'Contact restored', contact: restoredContact });
  } catch (err: any) {
    console.error(err);
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
