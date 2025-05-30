  import express, { Request, Response } from 'express';
  import { identifyContact } from '../services/contactService';
  import { ValidationError } from '../utils/error';
  import {softDeleteContact } from '../services/function'
  import { restoreContact } from '../services/function';
  const router = express.Router();

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
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedContact = await softDeleteContact(id);
      res.json({ message: 'Contact soft deleted', contact: updatedContact });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 2️⃣ Restore a Contact
  router.patch('/restore/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const restoredContact = await restoreContact(id);
      res.json({ message: 'Contact restored', contact: restoredContact });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  export default router;
