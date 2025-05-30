import express, { Request, Response } from 'express';
import { identifyContact } from '../services/contactService';
import { ValidationError } from '../utils/error';

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

export default router;
