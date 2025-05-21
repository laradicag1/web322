/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Lara Melissa Dicag 
*  Student ID: 135462232 
*  Date: 2024-08-05
*
*  Vercel Web App URL: https://web322-grd2itoij-lara-melissa-dicags-projects.vercel.app
* 
*  GitHub Repository URL: https://github.com/laradicag1/web322-app.git
*
********************************************************************************/ 
const express = require('express');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const storeService = require('./store-service');
const authData = require('./auth-service'); // Importing auth-service module
const clientSessions = require('client-sessions'); // Importing client-sessions

const app = express();
const upload = multer();

const HTTP_PORT = process.env.PORT || 8080;

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dshvshvu7',
    api_key: '274989288126352',
    api_secret: 'NL3-IkUIqJjOPkTv1y3SD40N6tE',
    secure: true
});

// Middleware to serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

// Client-sessions middleware
app.use(clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000, // 2 minutes
    activeDuration: 1000 * 60 // 1 minute
}));

// Custom middleware to make session available in templates
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// Set Handlebars as the view engine
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return (
                '<li class="nav-item"><a ' +
                (url == app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ') + ' href="' +
                url +
                '">' +
                options.fn(this) +
                "</a></li>"
            );
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return context;
        },
        formatDate: function (dateObj) {
            if (!dateObj || !(dateObj instanceof Date)) {
                return '';
            }
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }
    }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for active route
app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Ensure login middleware
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

// Route to redirect from "/" to "/shop"
app.get('/', (req, res) => {
    res.redirect('/shop');
});

// Route to serve the "about.hbs" file
app.get('/about', (req, res) => {
    res.render('about');
});

// Route to get all published items
app.get('/shop', async (req, res) => {
    let viewData = {};

    try {
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }
        items.sort((a, b) => {
            const dateA = new Date(a.itemDate);
            const dateB = new Date(b.itemDate);
            if (dateA.getTime() === dateB.getTime()) {
                return b.id - a.id;
            }
            return dateB - dateA;
        });
        let item = items[0];
        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

// Route to get a specific published item by ID
app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }
        items.sort((a, b) => {
            const dateA = new Date(a.itemDate);
            const dateB = new Date(b.itemDate);
            if (dateA.getTime() === dateB.getTime()) {
                return b.id - a.id;
            }
            return dateB - dateA;
        });
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

// Route to get all items with optional filters
app.get('/items', ensureLogin, (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => res.render('items', { items: data.length ? data : null, message: data.length ? null : "no results" }))
            .catch(err => {
                console.error("Error in /items route with category filter:", err);
                res.status(500).render('items', { message: "no results" });
            });
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(data => res.render('items', { items: data.length ? data : null, message: data.length ? null : "no results" }))
            .catch(err => {
                console.error("Error in /items route with minDate filter:", err);
                res.status(500).render('items', { message: "no results" });
            });
    } else {
        storeService.getAllItems()
            .then(data => res.render('items', { items: data.length ? data : null, message: data.length ? null : "no results" }))
            .catch(err => {
                console.error("Error in /items route:", err);
                res.status(500).render('items', { message: "no results" });
            });
    }
});

// Route to get an item by ID
app.get('/item/:id', ensureLogin, (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.json(data))
        .catch(err => {
            console.error("Error in /item/:id route:", err);
            res.status(500).json({ message: err });
        });
});

// Route to get all categories
app.get('/categories', ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(data => res.render('categories', { categories: data.length ? data : null, message: data.length ? null : "no results" }))
        .catch(err => {
            console.error("Error in /categories route:", err);
            res.status(500).render('categories', { message: "no results" });
        });
});

// New route to serve the addItem.hbs file
app.get('/items/add', ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(data => res.render('addItem', { categories: data }))
        .catch(err => res.render('addItem', { categories: [] }));
});

// Route to handle adding a new item
app.post('/items/add', ensureLogin, upload.single('featureImage'), (req, res) => {
    console.log('Received request to add item:', req.body);
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            console.log('Cloudinary upload result:', result);
                            resolve(result);
                        } else {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            try {
                let result = await streamUpload(req);
                return result;
            } catch (error) {
                console.error('Upload error:', error);
                throw error;
            }
        }

        upload(req).then((uploaded) => {
            console.log('Image uploaded to Cloudinary:', uploaded.url);
            processItem(uploaded.url);
        }).catch(err => {
            console.error("Error uploading to Cloudinary:", err);
            res.status(500).json({ message: 'Error uploading image', error: err.message });
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        req.body.postDate = new Date().toISOString().split('T')[0];
        console.log('Processing item with imageUrl:', imageUrl);
        // Process the req.body and add it as a new Item before redirecting to /items
        storeService.addItem(req.body)
            .then(() => {
                console.log('Item added successfully');
                res.redirect('/items');
            })
            .catch(err => {
                console.error("Error adding item:", err);
                res.status(500).json({ message: 'Error adding item', error: err.message });
            });
    }
});

// Route to serve the "addCategory.hbs" file
app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory');
});

// Route to handle adding a new category
app.post('/categories/add', ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect('/categories'))
        .catch(err => {
            console.error("Error adding category:", err);
            res.status(500).json({ message: 'Error adding category', error: err.message });
        });
});

// Route to delete a category by ID
app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect('/categories'))
        .catch(err => {
            console.error("Error deleting category:", err);
            res.status(500).send('Unable to Remove Category / Category not found');
        });
});

// Route to delete an item by ID
app.get('/items/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteItemById(req.params.id)
        .then(() => res.redirect('/items'))
        .catch(err => {
            console.error("Error deleting item:", err);
            res.status(500).send('Unable to Remove Item / Item not found');
        });
});

// Login route
app.get('/login', (req, res) => {
    res.render('login');
});

// Register route
app.get('/register', (req, res) => {
    res.render('register');
});

// Register user
app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User created" });
        })
        .catch(err => {
            res.render('register', { errorMessage: err, userName: req.body.userName });
        });
});

// Login user
app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/items');
        })
        .catch(err => {
            res.render('login', { errorMessage: err, userName: req.body.userName });
        });
});

// Logout user
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

// User history
app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory');
});

// Handle 404 - Page Not Found
app.use((req, res) => {
    res.status(404).render('404');
});

// Initialize the store service and auth service, then start the server
storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => { 
            console.log(`Express http server listening on port ${HTTP_PORT}`); 
        });
    })
    .catch(err => {
        console.error("Unable to start server:", err);
    });

module.exports = app; // Export the app for Vercel