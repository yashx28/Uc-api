const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const userModal = require('./modal/user');
const ServiceModel = require('./modal/serviceModal');
const BookingModel = require('./modal/bookingModal');
const Otp = require('./modal/otpModel');
const BarberModel = require('./modal/barberModal');
const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connect
require('dotenv').config();

console.log('MONGO URI:', process.env.MONGO_URI); // add this temporarily to confirm it’s loaded

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ Connection error:', err.message));
// ✅ Send OTP (only if email exists)
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModal.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up.' });
    }

    const role = email === 'yashbhatia81989@gmail.com' ? 'admin' : 'user';

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

    await Otp.deleteMany({ email }); // remove old OTPs
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

    // ✅ Await instead of callback
    await transporter.sendMail(mailOptions);

    return res.send({ message: 'OTP sent to email', role });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

// ✅ Delete a user by ID
app.delete('/delete-user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await userModal.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error });
  }
});


// ✅ Verify OTP (and send role again)
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
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

// ✅ Signup
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
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err });
  }
});

// ✅ Services
app.post('/addservice', async (req, res) => {
  const { name, price, image } = req.body;

  try {
    await ServiceModel.create({ name, price, image });
    res.status(201).send({ message: 'Service added successfully' });
  } catch (error) {
    console.error('Error saving service:', error);
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

// service route file or main server file
app.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ServiceModel.findByIdAndDelete(id);
    res.status(200).send({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).send({ error: 'Failed to delete service' });
  }
});



// ✅ Barbers
app.post('/addbarber', async (req, res) => {
  const { name, email, image } = req.body;
  try {
    await BarberModel.create({ name, email, image });
    res.status(201).send({ message: 'Barber added successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error adding barber', error });
  }
});

// ✅ Delete a barber by ID
app.delete('/delete-barber/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await BarberModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Barber deleted successfully' });
  } catch (error) {
    console.error('Error deleting barber:', error);
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

// ✅ Users
app.get('/users', async (req, res) => {
  try {
    const users = await userModal.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

// ✅ Bookings
app.get('/bookings', async (req, res) => {
  try {
    const users = await BookingModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

app.post('/bookings', async (req, res) => {
  const { date, timeSlot } = req.body;

  try {
    // ✅ Check for conflict
    const existingBooking = await BookingModel.findOne({ date, timeSlot });

    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    // ✅ Save new booking
    await BookingModel.create(req.body);
    res.status(201).send({ message: 'Booking saved successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error saving booking', error: err });
  }
});

// ✅ Contact form
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
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// ✅ Default route
app.get('/', (req, res) => {
  res.send('API Running');
});

// ✅ Start Server
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

