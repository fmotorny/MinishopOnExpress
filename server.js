const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const exphbs = require('express-handlebars');
const path = require('path');
const Category = require('./models').Category;
const Product = require('./models').Product;
const Promise = require('promise');

var api_key = 'key-1ed395ffbc854e80e99d854b5446f85f';
var domain = 'mail.axsrv.ru';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});


const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })


Category.destroy({
    where: {},
    truncate: true
});
 Category.create(
     {
         name: 'Clothes'
     }
 );
Category.create(
    {
        name: 'Footwear'
    }
);
Category.create(
    {
        name: 'Accessories'
    }
);

const app = express();



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    store: new SQLiteStore,
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false }
}));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));


//app.use(express.static(path.join(__dirname, 'uploads')));



app.engine('hbs', exphbs({defaultLayout: 'main', extname: 'hbs', layoutsDir: __dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');



// app.use("/", categoryRoutes);




// ROUTES

// app.use(function (req, res, next) {
//     res.status(404).send("Sorry can't find that!")
// });


// app.get('*', function(req, res){
//     console.log(req);
//     console.log(res);
//
// });


// app.use(function (req, res, next) {
//
// });



app.get('/', (req, res, next) => {


    let totalQTY = 0;

    if(req.session.cart) {


        for(let i = 0; i < req.session.cart.length; i++) {
            //  console.log(req.session.cart[i].qty);
            if(req.session.cart[i].qty) {
                totalQTY += req.session.cart[i].qty;
            } else {
                totalQTY += 1;
            }

        }
        req.session.cart.totalQty = totalQTY;
        res.locals.itemProduct = req.session.cart;
        res.locals.totalItems = req.session.cart.totalQty;
    } else {
        res.locals.totalItems = totalQTY;
    }



    //








    const report_category = new Promise(function(resolve, reject) {
        Category.findAll({

        }).then(report_category => {
            console.log('Summary Result Report Details found');
            resolve(report_category);
        });
    });
    const report_product = new Promise(function(resolve, reject) {
        Product.findAll({

        }).then(report_product => {
            console.log('Summary Result Report Details found');
            resolve(report_product);
        });
    });

    Promise.all([report_category, report_product]).then(function(data) {
        res.render('index', {category: data[0], product: data[1]});
    }).catch(err => {
        console.log(err);
    });

    console.log(req.session.cart);
});
app.get('/edit/:id', (req, res)=> {

    console.log(req.params.id);

    const showCategory = new Promise((resolve, reject) => {
        Category.findAll({
        }).then(category => {
            resolve(category);
        });
    });

    const showProduct = new Promise((resolve, reject) => {
        Product.findOne({
            where: {
                id: req.params.id
            }
        }).then(product => {
            resolve(product);
        });
    });

    Promise.all([showCategory, showProduct]).then(function(data) {
        if(data[1]) {
            res.render('product', {category: data[0], product: data[1]});
        } else {
            res.status(404).send("Sorry can't find that!");
        }


    }).catch(err => {
        console.log(err);
    });




});


app.get('/addToCart/:productId', (req, res) => {



    if (!req.session.cart) req.session.cart = [];
    const cart = req.session.cart;

    Product.findOne({
        where: {
            id: req.params.productId
        }
    }).then(product => {
       // console.log(product.id);
        function idExists(id) {
            return cart.some(function(el) {
                return el.id === id;
            });
        }

        if (idExists(product.id)) {
            console.log('existTTT');
        } else {
            req.session.cart['test'] = 1;
            cart.push(product);


        }

        res.redirect('/');
    });


});

app.get('/shopCart', (req, res) => {


    let totalPrice = 0;
    const shopData = req.session.cart;

    if(shopData) {
        for(let i = 0; i < shopData.length; i++) {

            if(req.session.cart[i].totalSumm ) {
                req.session.cart[i]['summ'] = shopData[i].totalSumm;
                totalPrice += parseFloat(shopData[i].totalSumm);
            } else {
                req.session.cart[i].qty = 1;
                req.session.cart[i]['summ'] = shopData[i].price;
                totalPrice += parseFloat(shopData[i].price);
            }


            // totalQTY += req.session.cart[i].qty;

            // console.log(req.session.cart[i]);

        }
    }






    // req.session.cart.totalQty = totalQTY;


    res.render('cart', {cartItems: req.session.cart, totalPrice: totalPrice})
});

app.get('/shopCart/productDelete/:id', (req, res) => {
    const ind = parseFloat(req.params.id);
    function remove(array, element) {
        return array.filter(e => e.id !== element);
    }
    req.session.cart = remove(req.session.cart, ind);
    res.redirect('/shopCart');
});

app.post('/shopCart/addQty/:id', (req, res) => {
    const ind = parseFloat(req.params.id);
    const qty = parseFloat(req.body.qty);
    for(let i = 0; i < req.session.cart.length; i++) {
        if(req.session.cart[i].id === ind) {

            req.session.cart[i].qty = qty;
            req.session.cart[i].totalSumm = req.session.cart[i].price * qty;
        }

       // console.log('ADD QTY', req.session.cart);
    }
    res.redirect('/shopCart');
});




app.post('/addProduct', upload.single('productImage'), (req, res) => {
    console.log(req.body);
    console.log(req.file);
    console.log(req.body.category);

    Product.create({
        name: req.body.title,
        price: req.body.price,
        image: req.file.originalname,
        category: req.body.category
    }).then(() => {
        res.redirect('/')
    });
});

app.post('/updateProduct/:productId', upload.single('productImage'), (req, res) => {
    console.log(req.body);
    console.log(req.file);

    if (!req.file) {
        console.log('IMAGE NOT EXIST');
        Product.update(
            {
                name: req.body.title,
                price: req.body.price,
                category: req.body.category
            },
            { where: {
                id: req.params.productId
                }
            }
            ).then(()=> {
            res.redirect('/');
        });
    } else {
        console.log('IMAGE EXIST');
        Product.update(
            {
                name: req.body.title,
                price: req.body.price,
                image: req.file.originalname,
                category: req.body.category
            },
            { where: {
                    id: req.params.productId
                }
            }
        ).then(()=> {
            res.redirect('/');
        });
    }

});

app.post('/deleteProduct/:productId', (req, res) => {
    Product.destroy(
        { where: {
                id: req.params.productId
            }
        }
    ).then(()=> {
        res.redirect('/');
    });
});

app.post('/sendToEmail', (req, res) => {
    console.log(req.session.cart);

    let html = '';
    html += '<!DOCTYPE html>' +
        '<html lang="en">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<title>Title</title>' +
        '</head>' +
        '<body>';

    html += JSON.stringify(req.session.cart);

    html += '</body>' +
    '</html>';




    var data = {
        from: 'Test <me@mme.com>',
        to: 'fmotorny@mail.ru',
        subject: 'Testi',
        html: html
       // text: req.session.cart
    };

    // mailgun.messages().send(data, function(err, body){
    //     if(err){
    //         res.render('error', {error: err});
    //         console.log("got an error:", err);
    //     } else{
    //         res.render('submitted', {email: req.body.email});
    //         console.log(body);
    //     };
    // });

    mailgun.messages().send(data, function (error, body) {
        console.log(body);
    });

    res.redirect('/shopCart');
});



app.get('*', function(req, res){
    res.send('Sorry route not found', 404);
});

app.listen(3333, () => console.log('Listening on port 3333'));