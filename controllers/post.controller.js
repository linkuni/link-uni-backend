import Post from "../models/post.model.js"
import User from "../models/user.model.js";
import getPosts from "../utils/getPosts.js";
import path from "path";
import { fileURLToPath } from 'url';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from 'multer';
import multerS3 from 'multer-s3';
import stream from 'stream';
import getFilterPosts from "../utils/getFilterPosts.js";
import axios from 'axios';
import FormData from 'form-data';
import Exam from "../models/exam.model.js";
import Summary from "../models/summary.model.js";

const getAnonymousUserId = async () => {
  const anonymous = await User.findOne({ username: "anonymous" });
  if (!anonymous) {
    const anonymousUser = new User({
      username: "anonymous",
      firstname: "Anonymous",
      lastname: "User",
      email: "anonymous@yourdomain.com",
      password: "securepassword", 
      isAdmin: false,
      profilePicture: "", 
      program: "NA",
      yearOfGraduation: "NA",
  });
  
  await anonymousUser.save();
  }
  return anonymous._id;
}



// export const createPost = async (req, res, next) => {
//   try {
//       const { title, desc, program, course, resourceType } = req.body;

//       // Extract the uploaded file from multer (req.file)
//       const file = req.file;

//       if (!file) {
//           return res.status(400).json({ message: "File is required" });
//       }

//       const userId = req.user.id;

//       if (!userId || !title || !file.mimetype || !file.filename) {
//           return res.status(400).json({ message: "Missing required fields" });
//       }

//       const fileUrl = `/uploads/${file.filename}`;

//       const newPost = new Post({
//           userId,
//           title,
//           desc,
//           fileUrl: file.filename,
//           fileType: file.mimetype,
//           fileName: file.originalname,
//           category:{
//             program,
//             course,
//             resourceType
//           }
//       });

//       const savedPost = await newPost.save();

//       const user = await User.findById(userId);

//       if (!user) {
//           return res.status(404).json({ message: "User does not exist!" });
//       }

//       await user.updateOne({ $push: { posts: savedPost._id } });

//       res.status(201).json({ message: "Post successfully uploaded!", newPost: savedPost });

//   } catch (e) {
//       console.log(e);
//       res.status(500).json({ message: e.message });
//   }
// };

// export const downloadFile = async (req, res, next) => {
//   const folderId = req.user.id;
//   const fileName = req.params.fileName;
//   const directoryPath = path.join(__dirname, `../uploads/${folderId}/`); 

//     const filePath = path.join(directoryPath, fileName);

//     res.download(filePath, (err) => {
//       if (err) {
//           console.error("Error while downloading file:", err);
//           res.status(500).json({
//               message: "Could not download the file. " + err,
//           });
// }})};

export const updatePost = async (req,res,next) => {
    try{
        const postId = req.params.postId;
        const updates = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }

    if(post.userId.toString()!==req.user.id.toString()){
        return res.status(403).json({message: "You're not authorized to modify this post!"})
    }
    
    if (updates.title !== undefined) {
      post.title = updates.title;
    }
    if (updates.desc !== undefined) {
      post.desc = updates.desc;
    }
    if (updates.program !== undefined) {
      post.category.program = updates.program;
    }
    if (updates.category !== undefined) {
      
      post.category.resourceType = updates.category.resourceType;
    }
    if (updates.course !== undefined) {
      post.category.course = updates.course;
    }
    if(!updates.title && !updates.desc && !updates.program && !updates.course && !updates.category){
      return res.status(400).json({message: "No updates provided!"})
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post
    });

    }catch(e){
        res.status(500).json({message: e.message})
    }
}

export const anonymizePost = async (req, res, next) => {
  try {
    const ANONYMOUS_USER_ID = await getAnonymousUserId();
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }

    if (req.user.id !== post.userId.toString()) {
      return res.status(403).json({ message: "You're not allowed to anonymize this post" });
    }

    post.isAnonymous = true;
    post.userId = ANONYMOUS_USER_ID;
    const user = await User.findById(req.user.id);
    user.posts = user.posts.filter(postId => postId.toString() !== post._id.toString());
    await post.save();

    res.status(200).json({ message: "The post has been anonymized", anonymousId:ANONYMOUS_USER_ID});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

export const getPost = async (req,res,next) => {
  try{
    const posts = await getPosts()
    const post = posts.find(post => post._id.toString() === req.params.postId)

    if(!post){
      return res.status(404).json({message: "Post doesn't exist!"})
    }

    res.status(200).json(post)
} catch(e){
    res.status(500).json({message: e.message})
}
}

export const allPosts = async (req, res, next) => {
  try {
    const posts = await getPosts();
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({message: err.message});
  }
}

export const userPosts = async (req,res,next) => {
  try{
    const user = await User.findById(req.params.userId)
    if(!user){
      return res.status(404).json({message: "User not found"})
    }
    const allPosts = await getPosts()
    const posts = allPosts.filter(post => post.author._id?.toString() === req.params.userId)
    console.log(posts)
    res.status(200).json(posts)

  }catch(e){
    console.log(e)
  }
}

export const savedPosts = async (req,res,next) => {
  try{
    const user = await User.findById(req.params.userId)
    if(!user){
      return res.status(404).json({message: "User not found"})
    }
    const allPosts = await getPosts()
    const posts = allPosts.filter(post => user.savedPosts.includes(post._id.toString()))
    res.status(200).json(posts)
  }catch(e){
    console.log(e)
  }
}

export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }

    if (!post.likes.includes(req.user.id)) {

      await post.updateOne({ $push: { likes: req.user.id } });
      res.status(200).json({ message: "The post has been liked", offset: 1 });
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } });
      res.status(200).json({ message: "The post has been disliked", offset: -1 });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


export const savePost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User doesn't exist!" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }

    let updatedSavedPosts;
    if (!user.savedPosts.includes(req.params.postId)) {
      updatedSavedPosts = [...user.savedPosts, req.params.postId];
      
      user.savedPosts = updatedSavedPosts;
      await user.save();
      const { password, ...rest } = user._doc;
      res.status(200).json({ message:"Post has been saved", rest });
    } else {
      updatedSavedPosts = user.savedPosts.filter(postId => postId !== req.params.postId);
      
      user.savedPosts = updatedSavedPosts;
      await user.save();
      const { password, ...rest } = user._doc;
      res.status(200).json({ message:"Post has been removed saved", rest });
    }

    
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,  // Ensure correct region from env
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// Set up multer to upload files to S3 using the AWS SDK v3
const upload = multer({
  storage: multerS3({
    s3: s3Client,  // This needs to be correctly passed
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const fileName = `${new Date().getTime()}__${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 10000000 }, // 10 MB file size limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/)) {
      return cb(new Error("Unsupported file format"));
    }
    cb(null, true);
  },
});

// Upload post function
export const uploadPost = async (req, res, next) => {

  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, desc, program, course, resourceType } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      // Process the uploaded file information
      const fileUrl = req.file.location;  // Get the S3 file URL
      const fileKey = req.file.key;  // Get the S3 file`s key

      // Create and save the new post with the uploaded file details
      const newPost = new Post({
        userId: req.user.id,
        title,
        desc,
        fileUrl,
        fileKey,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
        category: {
          program,
          course,
          resourceType,
        },
        processingStatus: {
          examQuestions: "pending",
          summary: "pending"
        }
      });

      const savedPost = await newPost.save();

      // Update the user's post list
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await user.updateOne({ $push: { posts: savedPost._id } });

      // Trigger the API calls in the background
      processDocument(savedPost._id, req.file);

      res.status(201).json({ message: "Post successfully uploaded!", newPost: savedPost });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Function to process document using external APIs
const processDocument = async (postId, file) => {
  try {
    // Get the file from S3
    const post = await Post.findById(postId);
    if (!post) {
      console.error("Post not found for processing");
      return;
    }

    // Prepare to download the file from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: post.fileKey,
    };
    
    const command = new GetObjectCommand(params);
    const s3Response = await s3Client.send(command);
    
    // Create a buffer from the S3 stream
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Call the generate-questions API
    generateExamQuestions(postId, fileBuffer, post.fileName);
    
    // Call the extract-text API
    generateSummary(postId, fileBuffer, post.fileName);

  } catch (error) {
    console.error("Error processing document:", error);
    await Post.findByIdAndUpdate(postId, {
      'processingStatus.examQuestions': 'failed',
      'processingStatus.summary': 'failed'
    });
  }
};

// Function to generate exam questions
const generateExamQuestions = async (postId, fileBuffer, fileName) => {
  try {
    // Update status to processing
    await Post.findByIdAndUpdate(postId, { 'processingStatus.examQuestions': 'processing' });
    
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });
    
    const response = await axios.post(
      'http://127.0.0.1:5678/api/v1/generate-questions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 1800000 // 30 minutes timeout
      }
    );
    
    if (response.data && response.data.questions) {
      // Store each question in the Exam model
      for (const question of response.data.questions) {
        const examEntry = new Exam({
          postId,
          question: question.question,
          answer: question.answer,
          keyPoints: question.key_points,
          tips: question.tips
        });
        await examEntry.save();
      }
      
      // Update status to completed
      await Post.findByIdAndUpdate(postId, { 'processingStatus.examQuestions': 'completed' });
    } else {
      throw new Error("Invalid response from generate-questions API");
    }
  } catch (error) {
    console.error("Error generating exam questions:", error);
    await Post.findByIdAndUpdate(postId, { 'processingStatus.examQuestions': 'failed' });
  }
};

// Function to generate summary
const generateSummary = async (postId, fileBuffer, fileName) => {
  try {
    // Update status to processing
    await Post.findByIdAndUpdate(postId, { 'processingStatus.summary': 'processing' });
    
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });
    
    const response = await axios.post(
      'http://127.0.0.1:5678/api/v1/extract-text',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 1800000 // 30 minutes timeout
      }
    );
    
    if (response.data && response.data.summary) {
      const summaryData = response.data.summary;
      
      // Create and save the summary
      const summaryEntry = new Summary({
        postId,
        title: summaryData.title || "",
        overview: summaryData.overview || "",
        mainPoints: summaryData.main_points || [],
        importantTerms: summaryData.important_terms || [],
        benefits: summaryData.benefits || "",
        riskOrLimitations: summaryData.risks_or_limitations || "",
        recommendations: summaryData.recommendations || "",
        conclusion: summaryData.conclusion || ""
      });
      await summaryEntry.save();
      
      // Update status to completed
      await Post.findByIdAndUpdate(postId, { 'processingStatus.summary': 'completed' });
    } else {
      throw new Error("Invalid response from extract-text API");
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    await Post.findByIdAndUpdate(postId, { 'processingStatus.summary': 'failed' });
  }
};

// Endpoint to check processing status
export const checkProcessingStatus = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Return the processing status
    res.status(200).json({
      processingStatus: post.processingStatus || {
        examQuestions: "unknown",
        summary: "unknown"
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }

    // Extract the necessary file information from the post
    const { fileName, fileType, fileKey } = post;

    if (!fileKey) {
      return res.status(400).json({ message: "File key is missing in the post!" });
    }

    // Set up the parameters to get the object from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,  // Ensure this is a valid string
    };

    // Get the file from S3
    const command = new GetObjectCommand(params);

    const s3Response = await s3Client.send(command);

    // Set the response headers to allow for file download
    res.set({
      "Content-Type": fileType || "application/octet-stream",  // Default to binary if fileType is missing
      "Content-Disposition": `attachment; filename="${fileName || 'file'}"`,  // Default to 'file' if fileName is missing
    });

    // Pipe the S3 response stream to the response object
    const passThroughStream = new stream.PassThrough();
    stream.pipeline(s3Response.Body, passThroughStream, (err) => {
      if (err) {
        console.error("Error streaming file from S3:", err);
        return res.status(500).json({ message: "Error downloading file" });
      }
    });

    passThroughStream.pipe(res); // Pipe the file content back to the client

  } catch (e) {
    console.error("Download error:", e);
    res.status(500).json({ message: e.message });
  }
};

// Function to delete a file from S3
const deleteFileFromS3 = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    };

    // Create the command
    const command = new DeleteObjectCommand(params);

    // Send the command to delete the object
    await s3Client.send(command);

    console.log(`File with key ${fileKey} deleted successfully from S3`);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Error deleting file from S3");
  }
};

export const deletePost = async (req, res, next) => {
  try {
    console.log("postid:",req.params.postId);
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }
    if (req.user.id !== post.userId.toString()) {
      return res.status(403).json({ message: "You're not allowed to delete this post" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    await user.updateOne({ $pull: { posts: post._id } });
    await post.deleteOne({
      _id: req.params.postId,
    });
    await deleteFileFromS3(post.fileKey);
    res.status(200).json({ message: "The post has been deleted" });
  } catch (e) {
    console.log("here")
    res.status(500).json({ message: e.message });
  }
}

export const filterPost = async (req, res, next) => {
  try {
    const { program, course, resourceType, semester, fileType, sort, keyword } = req.body;

    const posts = await getFilterPosts({ program, course, resourceType, semester, fileType, sort, keyword });

    res.status(200).json(posts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportPost = async (req, res, next) => {
  try{
    const post = await Post.findById(req.params.postId);
    if(!post){
      return res.status(404).json({message: "Post doesn't exist!"})
    }
    const user = await User.findById(req.user.id);
    if(!user){
      return res.status(404).json({message: "User doesn't exist!"})
    }
    await post.updateOne({isBlacklisted: true});
    await user.updateOne({$push: {blacklistedPosts: post._id}});
    res.status(200).json({message: "Post has been reported"})
  }catch(e){
    res.status(500).json({message: e.message})
  }
}

// Function to generate a presigned URL for a file in S3
export const getPresignedUrl = async (req, res, next) => {
  try{
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if(!post){
      return res.status(404).json({message: "Post doesn't exist!"})
    }
    const key = post.fileKey;
    const client = new S3Client({ 
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.S3_PRESIGNED_URL_ACCESS_KEY,
        secretAccessKey: process.env.S3_PRESIGNED_URL_SECRET_ACCESS_KEY
      }
    });
    
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    
    try {
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      return res.status(200).json({signedUrl});
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  }catch(e){
    res.status(500).json({message: e.message})
  }
};

// Endpoint to get exam questions for a post
export const getExamQuestions = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const examQuestions = await Exam.find({ postId });
    
    if (!examQuestions || examQuestions.length === 0) {
      return res.status(404).json({ message: "No exam questions found for this post" });
    }
    
    res.status(200).json({ examQuestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint to get summary for a post
export const getSummary = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const summary = await Summary.findOne({ postId });
    
    if (!summary) {
      return res.status(404).json({ message: "No summary found for this post" });
    }
    
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin endpoint to manually trigger exam question generation
export const adminGenerateExamQuestions = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Update status to processing
    await Post.findByIdAndUpdate(postId, { 'processingStatus.examQuestions': 'processing' });
    
    // Get the file from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: post.fileKey,
    };
    
    const command = new GetObjectCommand(params);
    const s3Response = await s3Client.send(command);
    
    // Create a buffer from the S3 stream
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    // Remove any existing exam questions for this post
    await Exam.deleteMany({ postId });
    
    // Call the generate-questions API
    res.status(202).json({ 
      message: "Exam question generation started", 
      status: "processing" 
    });
    
    // Continue processing asynchronously
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: post.fileName });
    
    try {
      const response = await axios.post(
        'http://127.0.0.1:5678/api/v1/generate-questions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 300000 // 5 minutes timeout
        }
      );
      
      if (response.data && response.data.questions) {
        // Store each question in the Exam model
        for (const question of response.data.questions) {
          const examEntry = new Exam({
            postId,
            question: question.question,
            answer: question.answer,
            keyPoints: question.key_points,
            tips: question.tips
          });
          await examEntry.save();
        }
        
        // Update status to completed
        await Post.findByIdAndUpdate(postId, { 'processingStatus.examQuestions': 'completed' });
      } else {
        throw new Error("Invalid response from generate-questions API");
      }
    } catch (error) {
      console.error("Error generating exam questions:", error);
      await Post.findByIdAndUpdate(postId, { 'processingStatus.examQuestions': 'failed' });
    }
  } catch (error) {
    console.error("Error processing admin request:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Admin endpoint to manually trigger summary generation
export const adminGenerateSummary = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Update status to processing
    await Post.findByIdAndUpdate(postId, { 'processingStatus.summary': 'processing' });
    
    // Get the file from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: post.fileKey,
    };
    
    const command = new GetObjectCommand(params);
    const s3Response = await s3Client.send(command);
    
    // Create a buffer from the S3 stream
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    // Remove any existing summary for this post
    await Summary.deleteMany({ postId });
    
    // Send initial response to client
    res.status(202).json({ 
      message: "Summary generation started", 
      status: "processing" 
    });
    
    // Continue processing asynchronously
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: post.fileName });
    
    try {
      const response = await axios.post(
        'http://127.0.0.1:5678/api/v1/extract-text',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 300000 // 5 minutes timeout
        }
      );
      
      if (response.data && response.data.summary) {
        const summaryData = response.data.summary;
        
        // Create and save the summary
        const summaryEntry = new Summary({
          postId,
          title: summaryData.title || "",
          overview: summaryData.overview || "",
          mainPoints: summaryData.main_points || [],
          importantTerms: summaryData.important_terms || [],
          benefits: summaryData.benefits || "",
          riskOrLimitations: summaryData.risks_or_limitations || "",
          recommendations: summaryData.recommendations || "",
          conclusion: summaryData.conclusion || ""
        });
        await summaryEntry.save();
        
        // Update status to completed
        await Post.findByIdAndUpdate(postId, { 'processingStatus.summary': 'completed' });
      } else {
        throw new Error("Invalid response from extract-text API");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      await Post.findByIdAndUpdate(postId, { 'processingStatus.summary': 'failed' });
    }
  } catch (error) {
    console.error("Error processing admin request:", error);
    return res.status(500).json({ message: error.message });
  }
};

