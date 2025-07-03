const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UPLOAD_DIR = './uploads';

if (!fs.existsSync(path.join(__dirname, '..', UPLOAD_DIR))) {
  fs.mkdirSync(path.join(__dirname, '..', UPLOAD_DIR), { recursive: true });
}
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
   cb(null, path.join(__dirname, '..', UPLOAD_DIR));
  },
  filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }});
function checkFileType(file, cb){
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb(new Error('Error: Images Only (JPEG, JPG, PNG, GIF)!'));
  }
}
const upload = multer({
  storage: storage,
  limits:{fileSize: 5 * 1024 * 1024},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }}).single('profileImage');
module.exports = upload;