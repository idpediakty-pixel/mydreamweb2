const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); // Serve photos

// 1. ഫോട്ടോ സേവ് ചെയ്യാനുള്ള സെറ്റപ്പ് (Multer) - Admission Number പേരിൽ സേവ് ചെയ്യുന്നു
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // uploads ഫോൾഡറിലേക്ക് മാറ്റുന്നു
    },
    filename: (req, file, cb) => {
        // req.body.admnNo വഴി വരുന്ന അഡ്മിഷൻ നമ്പറിന്റെ പേരിൽ ഫോട്ടോ റീനെയിം ചെയ്യുന്നു
        const admnNo = req.body.admnNo || 'unknown'; 
        const ext = path.extname(file.originalname);
        cb(null, `${admnNo}${ext}`); 
    }
});
const upload = multer({ storage: storage });

// 2. MongoDB Database Schema (ഡാറ്റാബേസ് ഘടന)
const studentSchema = new mongoose.Schema({
    admnNo: { type: String, required: true, unique: true }, // Unique (Duplicate ഒഴിവാക്കാൻ)
    name: String,
    classDept: String,
    guardian: String,
    mobile: String,
    house: String,
    place: String,
    photoUrl: String,
    orgId: String // ഏത് സ്കൂൾ ആണെന്ന് തിരിച്ചറിയാൻ
});
const Student = mongoose.model('Student', studentSchema);

// 3. API Route - പുതിയ ഡാറ്റ സേവ് ചെയ്യാൻ (അല്ലെങ്കിൽ പഴയത് Replace ചെയ്യാൻ)
app.post('/api/students', upload.single('photo'), async (req, res) => {
    try {
        const { admnNo, name, classDept, guardian, mobile, house, place, orgId } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // ഫൈൻഡ് ചെയ്ത് അപ്ഡേറ്റ് ചെയ്യുക, ഇല്ലെങ്കിൽ പുതിയത് ക്രിയേറ്റ് ചെയ്യുക (Upsert)
        const savedStudent = await Student.findOneAndUpdate(
            { admnNo: admnNo, orgId: orgId }, // ഈ അഡ്മിഷൻ നമ്പറിൽ ഡാറ്റ ഉണ്ടോ എന്ന് നോക്കുന്നു
            { name, classDept, guardian, mobile, house, place, photoUrl }, 
            { new: true, upsert: true } // ഉണ്ടെങ്കിൽ replace ചെയ്യും, ഇല്ലെങ്കിൽ പുതിയത് ഉണ്ടാക്കും
        );

        res.status(200).json({ message: 'Data saved successfully', data: savedStudent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// പോർട്ട് കണക്ഷൻ
const PORT = process.env.PORT || 5000;
mongoose.connect('mongodb+srv://rajeeshparavath_db_user:g9IMlaLTAmsWp6fE@cicada.g9mf7tf.mongodb.net/idpedia')
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    });