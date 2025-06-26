const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const dotenv = require('dotenv');
dotenv.config();

const userModal = require('./modal/user');
const ServiceModel = require('./modal/serviceModal');
const BookingModel = require('./modal/bookingModal');
const Otp = require('./modal/otpModel');
const BarberModel = require('./modal/barberModal');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ Connection error:', err.message));


// ------------------ AUTH & OTP ------------------ //
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModal.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up.' });
    }

    const role = email === 'yashbhatia81989@gmail.com' ? 'admin' : 'user';
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'yashbhatia81989@gmail.com',
        pass: 'otjg xrdn bqly hbuf',
      },
    });

    const mailOptions = {
      from: 'yashbhatia81989@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    return res.send({ message: 'OTP sent to email', role });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const existingOtp = await Otp.findOne({ email, otp });
    if (!existingOtp) {
      return res.status(400).send({ error: 'Invalid or expired OTP' });
    }
    await Otp.deleteMany({ email });
    const role = email === 'yashbhatia81989@gmail.com' ? 'admin' : 'user';
    return res.send({ message: 'OTP verified. Login successful.', role });
  } catch (err) {
    res.status(500).send({ message: 'Server error' });
  }
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await userModal.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Already have account' });
    }
    const newUser = await userModal.create({ name, email, password });
    return res.json({ message: 'Signup successful', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});


// ------------------ SERVICES ------------------ //
app.post('/addservice', async (req, res) => {
  const { name, price, image } = req.body;
  try {
    await ServiceModel.create({ name, price, image });
    res.status(201).send({ message: 'Service added successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error adding service', error });
  }
});

app.get('/services', async (req, res) => {
  try {
    const services = await ServiceModel.find();
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch services', error: err });
  }
});

app.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ServiceModel.findByIdAndDelete(id);
    res.status(200).send({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete service' });
  }
});


// ------------------ BARBERS ------------------ //
app.post('/addbarber', async (req, res) => {
  const { name, email, image } = req.body;
  try {
    await BarberModel.create({ name, email, image });
    res.status(201).send({ message: 'Barber added successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error adding barber', error });
  }
});

app.delete('/delete-barber/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await BarberModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Barber deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete barber', error });
  }
});

app.get('/barbers', async (req, res) => {
  try {
    const barbers = await BarberModel.find();
    res.status(200).json(barbers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch barbers', error });
  }
});


// ------------------ USERS ------------------ //
app.get('/users', async (req, res) => {
  try {
    const users = await userModal.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

app.delete('/delete-user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await userModal.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error });
  }
});


// ------------------ BOOKINGS ------------------ //
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await BookingModel.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error });
  }
});

app.post('/bookings', async (req, res) => {
  const { date, timeSlot } = req.body;
  try {
    // Prevent duplicate time slots
    const existing = await BookingModel.findOne({ date, timeSlot });
    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }
    await BookingModel.create(req.body);
    res.status(201).send({ message: 'Booking saved successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Error saving booking', error: err });
  }
});

// ✅ Conflict-checking route (updated)
app.get('/bookings/check', async (req, res) => {
  const { date, time } = req.query;
  if (!date || !time) {
    return res.status(400).json({ message: 'Date and time required' });
  }

  try {
    const [hours, minutes] = time.split(':').map(Number);
    const userStart = new Date(`${date}T${time}`);
    const userEnd = new Date(userStart.getTime() + 60 * 60 * 1000); // +1 hour

    const bookings = await BookingModel.find({ date });

    const isConflict = bookings.some((booking) => {
      if (!booking.timeSlot) return false;
      const [startStr, endStr] = booking.timeSlot.split(' - ');
      const existingStart = new Date(`${date} ${startStr}`);
      const existingEnd = new Date(`${date} ${endStr}`);
      return userStart < existingEnd && userEnd > existingStart;
    });

    if (isConflict) {
      return res.json({ available: false });
    }

    return res.json({ available: true });

  } catch (err) {
    console.error('Error checking time slot:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});


// ------------------ CONTACT ------------------ //
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'yashbhatia81989@gmail.com',
        pass: 'otjg xrdn bqly hbuf',
      },
    });

    const mailOptions = {
      from: email,
      to: 'yashbhatia81989@gmail.com',
      subject: `New Contact from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email', error: err });
  }
});


// ------------------ DEFAULT & START ------------------ //
app.get('/', (req, res) => {
  res.send('API Running');
});

app.listen(3001, () => {
  console.log('🚀 Server is running on port 3001');
});
