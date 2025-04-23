import express from "express"
import { isAuthenticated, isAdmin } from "../middleware/auth.js";
import { 
    // createPost, 
    updatePost, 
    deletePost,
    allPosts,
    getPost,
    likePost,
    userPosts,
    savePost,
    anonymizePost,
    // downloadFile,
    uploadPost,
    downloadPost,
    filterPost,
    savedPosts,
    reportPost, 
    getPresignedUrl,
    checkProcessingStatus,
    getExamQuestions,
    getSummary,
    adminGenerateExamQuestions,
    adminGenerateSummary,
    getPyqSolutions,
    adminGeneratePyqSolutions
 } from "../controllers/post.controller.js"
 import multer from "multer";
 import path from "path";
 import { fileURLToPath } from 'url';
 import fs from "fs";

 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderId = req.user.id;
        const folderPath = path.join(__dirname, `../uploads/${folderId}/`);

        if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        }

        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });
  

const router = express.Router();

router.get("/",isAuthenticated, allPosts)
router.get("/all-post/:userId", userPosts)
router.get("/saved/:userId", savedPosts)
// router.post("/create-post", isAuthenticated, createPost)
// router.get("/download/:fileName", isAuthenticated, downloadFile)
router.get("/:postId", getPost)
router.put("/:postId/update",isAuthenticated, updatePost )
router.delete("/:postId/delete", isAuthenticated, deletePost)
router.put("/:postId/anonymize", isAuthenticated, anonymizePost)
router.put("/:postId/like", isAuthenticated, likePost)
router.put("/:postId/save", isAuthenticated, savePost)
router.put("/:postId/report", isAuthenticated, reportPost)
router.post("/upload", isAuthenticated, uploadPost)
router.get("/download-file/:postId",isAuthenticated, downloadPost)
router.post("/filter", filterPost)
router.get("/preview/:postId", isAuthenticated, getPresignedUrl)
router.get("/:postId/processing-status", isAuthenticated, checkProcessingStatus)
router.get("/:postId/exam-questions", isAuthenticated, getExamQuestions)
router.get("/:postId/summary", isAuthenticated, getSummary)
router.get("/:postId/pyq-solutions", isAuthenticated, getPyqSolutions)

// Admin routes - require admin privileges
router.post("/:postId/admin/generate-exam-questions", isAuthenticated, isAdmin, adminGenerateExamQuestions)
router.post("/:postId/admin/generate-summary", isAuthenticated, isAdmin, adminGenerateSummary)
router.post("/:postId/admin/generate-pyq-solutions", isAuthenticated, isAdmin, adminGeneratePyqSolutions)

export default router