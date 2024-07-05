const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose
    .connect("mongodb://localhost:27017/bookshop", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

// Define the Book schema
const bookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
});

const Book = mongoose.model("Book", bookSchema);
const User = mongoose.model("User", userSchema);
const Review = mongoose.model("Review", reviewSchema);

const createSampleData = async () => {
    // Clear existing data
    await Book.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});

    // Create sample users
    const users = await User.insertMany([
        {
            username: "user1",
            email: "user1@example.com",
            password: "password1",
        },
        {
            username: "user2",
            email: "user2@example.com",
            password: "password2",
        },
        {
            username: "user3",
            email: "user3@example.com",
            password: "password3",
        },
        {
            username: "user4",
            email: "user4@example.com",
            password: "password4",
        },
        {
            username: "user5",
            email: "user5@example.com",
            password: "password5",
        },
    ]);

    // Create sample books
    const books = await Book.insertMany([
        {
            isbn: "978-3-16-148410-0",
            title: "Example Book 1",
            author: "Author 1",
        },
        {
            isbn: "978-3-16-148411-7",
            title: "Example Book 2",
            author: "Author 2",
        },
        {
            isbn: "978-3-16-148412-4",
            title: "Example Book 3",
            author: "Author 3",
        },
        {
            isbn: "978-3-16-148413-1",
            title: "Example Book 4",
            author: "Author 4",
        },
        {
            isbn: "978-3-16-148414-8",
            title: "Example Book 5",
            author: "Author 5",
        },
    ]);

    // Create sample reviews
    const reviews = await Review.insertMany([
        {
            user: users[0]._id,
            book: books[0]._id,
            rating: 5,
            comment: "Great book!",
        },
        {
            user: users[1]._id,
            book: books[1]._id,
            rating: 4,
            comment: "Enjoyed it!",
        },
        {
            user: users[2]._id,
            book: books[2]._id,
            rating: 3,
            comment: "It was okay.",
        },
        {
            user: users[3]._id,
            book: books[3]._id,
            rating: 2,
            comment: "Not great.",
        },
        {
            user: users[4]._id,
            book: books[4]._id,
            rating: 1,
            comment: "Didn't like it.",
        },
    ]);

    // Link reviews to books
    for (const review of reviews) {
        const book = await Book.findById(review.book);
        book.reviews.push(review._id);
        await book.save();
    }

    console.log("Sample data created successfully");
    mongoose.connection.close();
};

// createSampleData().catch(err => console.log(err));


//Task 1: Get the book list available in the shop.- 2 Points

app.get("/books", async (req, res) => {
    try {
        const books = await Book.find(); // Fetch all books from the database
        res.json(books); // Send the list of books as a JSON response
    } catch (error) {
        res.status(500).json({ message: "Error fetching books", error });
    }
});

//Task 2: Get the books based on ISBN.- 2 Points
app.get("/books/search", async (req, res) => {
    const { isbn, author, title } = req.query;
    try {
        const searchQuery = {};
        if (isbn) searchQuery.isbn = isbn;
        if (author) searchQuery.author = new RegExp(author, "i"); // Case-insensitive search
        if (title) searchQuery.title = new RegExp(title, "i"); // Case-insensitive search

        const books = await Book.find(searchQuery);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Error searching books", error });
    }
});
//Task 3: Get all books by Author. -2 Points
app.get("/books/search", async (req, res) => {
    const { isbn, author, title } = req.query;
    try {
        const searchQuery = {};
        if (isbn) searchQuery.isbn = isbn;
        if (author) searchQuery.author = new RegExp(author, "i"); // Case-insensitive search
        if (title) searchQuery.title = new RegExp(title, "i"); // Case-insensitive search

        const books = await Book.find(searchQuery);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Error searching books", error });
    }
});
//Task 4: Get all books based on Title - 2 Points
app.get("/books/title/:title", async (req, res) => {
    const title = req.params.title;
    try {
        const books = await Book.find({ title: new RegExp(title, "i") }); // Case-insensitive search
        res.json(books);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching books by title",
            error,
        });
    }
});
//Task 5: Get book Review. - 2 Points
app.get("/books/:isbn/reviews", async (req, res) => {
    const isbn = req.params.isbn;
    try {
        // Find the book by ISBN
        const book = await Book.findOne({ isbn }).populate("reviews");
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        // Send the reviews of the found book
        res.json(book.reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error });
    }
});
//Task 6: Register New user – 3 Points
app.post("/users/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        let existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});

//Task 7: Login as a Registered user - 3 Points
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
app.post("/users/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { username: user.username, email: user.email },
            process.env.JWT_SECRET || 'your_jwt_secret_key', // Ensure JWT_SECRET is set in your environment variables
            { expiresIn: '1h' } // Optional: Set token expiration
        );

        // Return token as response
        res.json({ token });
    } catch (error) {
        console.error("Error logging in:", error); // Log the error for debugging
        res.status(500).json({ message: "Error logging in", error: error.message || error });
    }
});


//Task 8: Add/Modify a book review. - 2 Points
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid token" });
        }
        req.user = decoded; // Decoded payload from JWT
        next();
    });
};

app.post("/books/:isbn/reviews", async (req, res) => {
    const { isbn } = req.params;
    const { rating, comment } = req.body;

    try {
        // Find the book by ISBN
        const book = await Book.findOne({ isbn });
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Check if the user has already reviewed this book
        let existingReview = await Review.findOne({
            book: book._id,
        });

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.comment = comment;
            await existingReview.save();
            res.json({ message: "Review updated successfully" });
        } else {
            // Create new review
            const newReview = new Review({
                book: book._id,
                rating,
                comment,
            });
            await newReview.save();

            // Update book's reviews array
            book.reviews.push(newReview._id);
            await book.save();

            res.json({ message: "Review added successfully" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error adding/modifying review",
            error,
        });
    }
});



//Task 9: Delete book review added by that particular user - 2 Points
app.delete("/books/:isbn/reviews", async (req, res) => {
    const { isbn } = req.params;

    try {
        // Find the book by ISBN
        const book = await Book.findOne({ isbn });
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Find reviews associated with the book
        const reviews = await Review.find({ book: book._id });

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: "No reviews found for this book" });
        }

        // Delete each review associated with the book
        for (let review of reviews) {
            await review.deleteOne(); // Use deleteOne() to remove the document
        }

        // Clear book's reviews array
        book.reviews = [];
        await book.save();

        res.json({ message: "Reviews deleted successfully" });
    } catch (error) {
        console.error("Error deleting reviews:", error);
        res.status(500).json({ message: "Error deleting reviews", error });
    }
});





//Task 10: Get all books – Using async callback function – 2 Points
app.get("/books", async (req, res) => {
    try {
        const books = await Book.find({});
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Error fetching books", error });
    }
});
//Task 11: Search by ISBN – Using Promises – 2 Points
app.get("/books/isbn/:isbn", (req, res) => {
    const { isbn } = req.params;

    Book.findOne({ isbn })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: "Book not found" });
            }
            res.json(book);
        })
        .catch((error) => {
            res.status(500).json({
                message: "Error searching book by ISBN",
                error,
            });
        });
});
//Task 12: Search by Author – 2 Points
app.get("/books/author/:author", async (req, res) => {
    const { author } = req.params;

    try {
        const books = await Book.find({ author });
        res.json(books);
    } catch (error) {
        res.status(500).json({
            message: "Error searching books by author",
            error,
        });
    }
});

//Task 13: Search by Title - 2 Points
app.get("/books/title/:title", async (req, res) => {
    const { title } = req.params;

    try {
        const books = await Book.find({
            title: { $regex: title, $options: "i" },
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({
            message: "Error searching books by title",
            error,
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on: http://127.0.0.1:${PORT}`);
});
