const express = require('express'); 
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const multer = require('multer');
const nodemailer = require('nodemailer')

const { rmSync, unwatchFile } = require('fs');
const { DEC8_BIN } = require('mysql/lib/protocol/constants/charsets');
const e = require('connect-flash');

dotenv.config({ path: './.env' });
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // moram maknut


// ! express setup >>>>>>> start

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use('/public', express.static('public'))

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));

// * za EJS
app.use(function (req, res, next) {
    res.locals.session = req.session;
    res.locals.success = req.flash('success');
    next();
});

// ! express setup >>>>>>> end


// * KONEKCIJA ZA BAZU >>>>>>>>>>>>>>>>>>>>>>>> start

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

db.connect((err) => {
    if(err){
        console.log(err)
    }else {
        console.log('Database connected')
    }
})

// * KONEKCIJA ZA BAZU >>>>>>>>>>>>>>>>>>>>>>>> end



// * RUTE

app.get('/', (req,res) => {

    db.query("SELECT * FROM artikli", (err, data) => {
            if(data){
                res.render('index', { userData: data })
            }
            
    })

})



app.post('/', (req,res,) => {
    
    let { razred, stanje, smjer, razlog } = req.body;

    let string = "SELECT * FROM artikli";

    if(razred && stanje && smjer && razlog){
        string += " WHERE razred IN ("+ db.escape(razred)+") AND stanje IN ("+ db.escape(stanje)+") AND smjer IN ("+ db.escape(smjer)+") AND razlog IN ("+ db.escape(razlog)+")"
    }else if (razred && stanje && smjer){
        string += " WHERE razred IN ("+ db.escape(razred)+") AND stanje IN ("+ db.escape(stanje)+") AND smjer IN ("+ db.escape(smjer)+")"
    }else if (razred && stanje && razlog){
        string += " WHERE razred IN ("+ db.escape(razred)+") AND stanje IN ("+ db.escape(stanje)+") AND razlog IN ("+ db.escape(razlog)+")"
    }else if (razred && smjer && razlog){
        string += " WHERE razred IN ("+ db.escape(razred)+") AND smjer IN ("+ db.escape(smjer)+") AND razlog IN ("+ db.escape(razlog)+")"
    }else if (stanje && smjer && razlog){
        string += " WHERE stanje IN ("+ db.escape(stanje)+") AND smjer IN ("+ db.escape(smjer)+") AND razlog IN ("+ db.escape(razlog)+")"
    }else if(razred && stanje){
        string += " WHERE razred IN ("+ db.escape(razred)+") AND stanje IN ("+ db.escape(stanje)+")"
    }else if(razred && smjer){
        string += " WHERE razred IN ("+ db.escape(razred)+") AND smjer IN ("+ db.escape(smjer)+")"
    }else if(stanje && smjer){
        string += " WHERE stanje IN ("+ db.escape(stanje)+") AND smjer IN ("+ db.escape(smjer)+")"
    }else if(razred){
        string += " WHERE razred IN ("+ db.escape(razred)+")"
    }else if (stanje){
        string += " WHERE stanje IN ("+ db.escape(stanje)+")"
    }else if (smjer){
        string += " WHERE smjer IN ("+ db.escape(smjer)+")"
    }else if (razlog){
        string += " WHERE razlog IN ("+ db.escape(razlog)+")"
    }


    
    
    db.query(string, (err, data) => {
        if(data){res.render('index', { userData: data })}
    })


})

app.post('/send-email', (req,res) => {
    const { email, subject } = req.body;
    res.redirect('/send-email/' + email);
})  

app.get('/send-email/:id', (req,res) => {
    const email = req.params.id;
    res.render('contact-form', { receiver: email })
})







app.post('/send-email-form', (req, res) => {
    const { firstName, lastName, subject, message, receiver} = req.body;

    

    if(!firstName || !lastName || !subject || !message){
        res.send('Something went wrong')
    }else{
        db.query("SELECT * FROM users WHERE id=?", [req.session.currentUser], (err, data) => {

        const transporter = nodemailer.createTransport({
            service: 'gmail',                     //servis koji koristimo za mail
            auth: {
                user: 'sskemailtest@gmail.com',  //email s kojeg dolazi poruka
                pass: 'xpstoyvycnkypjhh'               //sifra emaila
            },
            tls: {
                rejectUnauthorized: false
              }
        })
    
        const mailOptions = {
            from: req.body.email,
            to: receiver,   //email na koji saljemo
            subject: `Poruka od  ${firstName} ${lastName}  (${data[0].email}): ${subject}`,
            text: message

            //kostur poruke
        }
    
        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.log(error);
                res.render('message', { message: error })
            } else {
                console.log('Email sent' + info.response)
                res.render('message', { message: 'Poruka poslana' })
            }
            })

        })
    }

})

app.get('/message', (req, res) => {
    res.render('message', { message: '' })
})


app.post('/artikl', (req,res) => {
    const { artikl_id } = req.body;
    res.redirect('/artikl/' + artikl_id);
})

app.get('/artikl/:id', (req, res) => {

    const artikl_id = req.params.id;


    db.query("SELECT * FROM artikli WHERE artikl_id = ? ", [artikl_id], function(err, data) {
        if(data){
                db.query("SELECT * FROM users WHERE id = ? ", [data[0].user_id], function(err, data2) {
                    
                    db.query("SELECT * FROM favourites WHERE user_id=? and artikl_id=?", [req.session.currentUser, artikl_id], (err,data3) => {
                       if(data3.length > 0){
                           console.log('sejvan')
                       }else{
                           console.log('nijee')
                       }
                       res.render('artikl', { artiklData: data, userData: data2, favData: data3})
                    })
                });

        } else {
            console.log(err)
        }   
    })

})


app.post('/moje-otvori', (req,res) => {
    const { artikl_id } = req.body;
    res.redirect('/artikl/' + artikl_id);
})

app.get('/moje-otvori/:id', (req, res) => {

    const artikl_id = req.params.id;


    db.query("SELECT * FROM artikli WHERE artikl_id = ? ", [artikl_id], function(err, data) {
        if(data){
                db.query("SELECT * FROM users WHERE id = ? ", [data[0].user_id], function(err, data2) {
                    res.render('artikl', { artiklData: data, userData: data2})
                });

        } else {
            console.log(err)
        }   
    })

})


app.get('/register', (req,res) => {
    const errMsg = req.flash('errMsg');
    res.render('register', { errMsg })
})

app.post('/register', async (req, res) => {
    let { name, email, password, confirmPass } = req.body;

    const sc = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

    // TODO: flash poruke napravit i postavit neke uvjete za sifru

    if(name, email, password === ''){
        req.flash('errMsg', 'Ispuni formu');
        res.redirect('register')
        } else if (name.length < 3) {
            req.flash('errMsg', 'Ime mora biti duze od 3 znaka');
            res.redirect('register')
            } else if (sc.test(name)) {
                req.flash('errMsg', 'Ime ne može sadržavati posebne znakove');
                res.redirect('register')
                } else if(!email.includes("ssklivno.net")){
                        req.flash('errMsg', 'Možete se prijaviti samo putem školskog emaila');
                        res.redirect('register')
                        } else if (password !== confirmPass){
                            req.flash('errMsg', 'Lozinke se ne podudaraju');
                            res.redirect('register')
                            } else if (password.length <= 6) {
                                req.flash('errMsg', 'Lozinka mora biti duza od 6 znakova');
                                res.redirect('register')
                            } else {
                                db.query("SELECT * FROM users WHERE email = ? ", [email], async function(err, results) {

                                    if(results.length > 0){
                                        req.flash('errMsg', 'Korisnik vec postoji');
                                        res.redirect('register')
                                    } else {

                                        randomNum = Math.round(Math.random() * (99999 - 10000) + 10000);
                                        console.log(randomNum)
                                        nameWait = name;
                                        emailWait = email;
                                        passwordWait = password;

                                        const transporter = nodemailer.createTransport({
                                            service: 'gmail',                     //servis koji koristimo za mail
                                            auth: {
                                                user: 'sskemailtest@gmail.com',  //email s kojeg dolazi poruka
                                                pass: 'xpstoyvycnkypjhh'               //sifra emaila
                                                //sifra ssktest4365
                                            },
                                            tls: {
                                                rejectUnauthorized: false
                                              }
                                        })
                                    
                                        const mailOptions = {
                                            from: 'SSK',
                                            to: email,   //email na koji saljemo
                                            subject: `KOD ZA POTVRDU REGISTRACIJE`,
                                            text: `Vaš kod za potvrdu registracije je ${randomNum}`
                                
                                            //kostur poruke
                                        }
                                    
                                        transporter.sendMail(mailOptions, (error, info) => {
                                            if(error){
                                                console.log(error);
                                            } else {
                                                console.log('Email sent' + info.response)
                                                res.redirect('potvrda')
                                            }
                                            })



                                    }
                                })
                             
                        }
})



let randomNum;
let nameWait;
let emailWait;
let passwordWait;

app.get('/potvrda', (req,res) => {
    const errMsg = req.flash('errMsg');
    res.render('potvrda', { userData: randomNum, errMsg})
})

app.post('/potvrda', async (req,res) => {
    const { potvrdaInput } = req.body;

    if(potvrdaInput == randomNum){

        let hashedPassword = await bcrypt.hash(passwordWait, 8);
        
        db.query('INSERT INTO users SET ?', {name: nameWait, email: emailWait, password: hashedPassword, user_image: 'default-image'}, (err, results) => {
            if(err){
            
         }else{
             console.log(results)
             res.redirect('login');
         }
         })
                                
     console.log(req.body)

    } else {
        req.flash('errMsg', 'Unesite valjani kod');
        res.redirect('potvrda')
    }
})


app.get('/admin', (req,res) => {
    if (req.session.loggedin) {
        console.log('Welcome back ' +  req.session.username)
        db.query("SELECT * FROM users WHERE id=?", [req.session.currentUser], (err, data) => {
            res.render('admin', { userData: data})
        })
        } else {
            console.log('Please log in to view this page')
            // res.render('admin', { message: 'Please log in to view this page'})
        }
})

app.post('/admin', (req,res) => {})







//! Use of Multer
const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/assets/images/')     // './public/images/' directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
const upload = multer({
    storage: storage
});


app.post("/update-user", upload.single('image'), (req, res) => {
    const { broj } = req.body

    if (req.file) {
        var imgsrc = req.file.filename
        db.query("UPDATE users SET user_image = ? WHERE id = ?", [imgsrc, req.session.currentUser], (err, data) => {
           if(data){
               console.log('SUCCESS')
            }else{
                console.log(err)
            }
        })
    } 

    if(broj){
        db.query("UPDATE users SET broj = ? WHERE id = ?", [broj, req.session.currentUser], (err, data) => {
            if(data){
                console.log('SUCCESS')
            }else{
                console.log(err)
            }
        })
    }

    res.redirect('/admin')
});


app.get('/logout', (req,res) => {
    if (req.session.loggedin) {
        req.session.destroy();
        console.log('LOGGED OUT')
        res.redirect('login')
        } else {
            res.render('admin', { message: 'Youre not even logged in'})
        }
});


app.get('/login', (req,res) => {
    const errMsg = req.flash('errMsg');
    res.render('login', { errMsg })
})


app.post('/login', async (req,res) => {

    let { email, password } = req.body;

   if(!email && !password){
        req.flash('errMsg', 'Ispuni formu');
        res.redirect('login');
        } else if(!email.includes("ssklivno.net")){
            req.flash('errMsg', 'Korisnik ne postoji');
            res.redirect('login');
            } else {
              db.query("SELECT * FROM users WHERE email = ? ", [email], function(err, results) {
                      if (results[0].password) {
                          bcrypt.compare(password, results[0].password, function(err, result) {
                            // console.log(password)
                            // console.log(results[0].password)
                            if(result) {
                                    console.log('SUCCESS')
                                    req.session.loggedin = true;
                                    req.session.username = email;
                                    req.session.currentUser = results[0].id;
                                    res.redirect('/');
                                } else {
                                    req.flash('errMsg', 'Pogrešna lozinka');
                                    res.redirect('login');
                                }
                          })
                      }
              });
            }
})


app.get('/create', (req, res) => {
    if (req.session.loggedin){
        res.render('create');
        } else {
        res.send('nemozeeeee')
        }
})

app.post('/create', upload.single('image'), (req, res) => {

    const { naslov, smjer, razred, razlog, stanje, opis, cijena } = req.body;
    console.log(req.body)

     db.query("SELECT * FROM users WHERE email = ? ", [req.session.username], function(err, results) {
         if(results.length > 0){

            if (!req.file) {
                    console.log("No file upload");
                    res.redirect('/create')
            } else {
                    const imgsrc = req.file.filename
                    db.query('INSERT INTO artikli SET ?', {naslov: naslov, smjer: smjer, razred: razred, razlog: razlog, stanje: stanje, opis: opis, cijena: cijena, user_id: results[0].id, artikl_image: imgsrc}, (err, data) => {
                        if(data){
                            console.log('SUCCESS')
                            res.redirect('/create')
                        }else{
                            console.log(err)
                        }
                    })
            } 
            
        
         }
     });

})


app.get('/moje-objave', (req, res) => {

    if(req.session.loggedin){
        db.query("SELECT * FROM users WHERE email = ?", [req.session.username], (err, data) => {
            if(data){
                db.query("SELECT * FROM artikli WHERE user_id = ?", [data[0].id], (err, data2) => {
                    if(data2){
                        const errMsg = req.flash('errMsg');
                        res.render('moje-objave', { userData: data2, errMsg})
                    }
                })
            }
        })
    } else {
        res.send("You're not logged in")
    }
    
})

app.post('/moje-objave', (req,res) => {
    const { artikl_id } = req.body;
    res.redirect('/uredi/' + artikl_id);
})



app.get('/uredi/:id', (req, res) => {

    if (req.session.loggedin){
        const artikl_id = req.params.id;

         db.query("SELECT * FROM artikli WHERE artikl_id = ?", [artikl_id], (err, data) => {
            if(data){
                const errMsg = req.flash('errMsg');
                res.render('uredi', { userData: data})
            }
            })

    } else {
        res.send('nemozeeeee')
    }
})




app.post('/uredi/:id', (req, res) => {
    const artikl_id = req.params.id;

    const { naslov, razred, smjer, razlog, stanje, opis, cijena } = req.body;

    if(naslov){
        db.query("UPDATE artikli SET naslov = ? WHERE artikl_id = ?", [naslov, artikl_id], (err, data) => {
            if(data){console.log('done naslov')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    if(razred){
        db.query("UPDATE artikli SET razred = ? WHERE artikl_id = ?", [razred, artikl_id], (err, data) => {
            if(data){console.log('done razred')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    if(smjer){
        db.query("UPDATE artikli SET smjer = ? WHERE artikl_id = ?", [smjer, artikl_id], (err, data) => {
            if(data){console.log('done smjer')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    if(razlog){
        db.query("UPDATE artikli SET razlog = ? WHERE artikl_id = ?", [razlog, artikl_id], (err, data) => {
            if(data){console.log('done razlog')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    if(stanje){
        db.query("UPDATE artikli SET stanje = ? WHERE artikl_id = ?", [stanje, artikl_id], (err, data) => {
            if(data){console.log('done stanje')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    if(opis){
        db.query("UPDATE artikli SET opis = ? WHERE artikl_id = ?", [opis, artikl_id], (err, data) => {
            if(data){console.log('done opis')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    if(cijena){
        db.query("UPDATE artikli SET cijena = ? WHERE artikl_id = ?", [cijena, artikl_id], (err, data) => {
            if(data){console.log('done opis')} else {console.log(err)}
        })
    } else {console.log('emtpy')}

    res.redirect('/uredi/' + artikl_id)
})  

app.post('/obrisi', (req, res) => {
    const { artikl_id } = req.body;

     db.query("DELETE FROM artikli WHERE artikl_id = ?", [artikl_id], (err, result) => {  
         if(result){
            req.flash('success', 'Post deleted')
            res.redirect('/moje-objave')
         } else {
             console.log(err)
         }
     })
})

app.post('/addToFav', (req, res) => {
    const { artikl_id } = req.body;


    db.query("SELECT * FROM favourites WHERE user_id =? AND artikl_id= ?;", [req.session.currentUser, artikl_id], (err, data) => {
        if(data.length > 0){
            console.log(data)
            console.log('POSTOJI')
            
        } else {

            console.log('NE POSTOJI')

            db.query('INSERT INTO favourites SET ?', {user_id: req.session.currentUser, artikl_id:  artikl_id}, (err, data) => {
                if(data){console.log('saved to favourites')}
            })
 
        } 

    })


    res.redirect('/artikl/' + artikl_id);
})


app.get('/favoriti', (req, res) => {

        db.query("SELECT * FROM artikli JOIN favourites ON favourites.artikl_id = artikli.artikl_id AND favourites.user_id= ?",[req.session.currentUser] , (err, data) => {
            console.log(data)
            console.log(data.length)
            res.render('favoriti', { userData: data })
        })

})

app.post('/fav-otvori', (req, res) => {
    const { artikl_id } = req.body;
    res.redirect('/artikl/' + artikl_id);
})

app.post('/obrisi-fav', (req, res) => {
    const { artikl_id } = req.body;
    db.query("DELETE FROM favourites WHERE artikl_id = ?", [artikl_id], (err, data) => {
        if(data){
            console.log(data)
            res.redirect('/favoriti');
        }
    })
})

app.post('/obrisi-fav-artikl', (req, res) => {
    const { artikl_id } = req.body;
    db.query("DELETE FROM favourites WHERE artikl_id = ?", [artikl_id], (err, data) => {
        if(data){
            console.log(data)
            res.redirect('/artikl/' + artikl_id);
        }
    })
})

app.post('/ocisti-fav', (req, res) => {
    db.query("DELETE FROM favourites WHERE user_id = ?", [req.session.currentUser], (err, data) => {
        if(data){
            console.log(data)
            res.redirect('/favoriti');
        }
    })
})




app.listen(5000, () => {
    console.log('Server started')
});