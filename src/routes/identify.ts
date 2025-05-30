import express, { Request, Response } from 'express';
import { identifyContact } from '../services/contactService';

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;