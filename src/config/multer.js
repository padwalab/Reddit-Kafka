import multer from "multer";

const storage = multer.memoryStorage({
  destination(_req, _file, callback) {
    callback(null, "");
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(
      new Error(
        "File type not supported. Allowed extensions are .jpb, .jpeg, .png"
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter,
});
