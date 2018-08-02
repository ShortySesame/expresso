const express = require ('express');
const app = express();
const bodyParser = require ('body-parser');
const morgan = require ('morgan');

const sqlite3 = require ('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const PORT = process.env.PORT || 4001;


app.use(express.static('public'));
app.use(morgan('dev'));
app.use(bodyParser.json());


// handle :employeeId parameters
app.param('/api/employees/:employeeId', (req, res, next, id) => {
 db.get(`SELECT * FROM Employee WHERE id = $id`, {$id: id}, (err, employee) => {
   if (err) {
     next(err);
   } else if (employee) {
     next();
   } else {
     res.sendStatus(404);
   }
 });
});


const validateEmployee = (req, res, next) => {
 const emp = req.body.employee;
 if (emp && emp.name && emp.position && emp.wage) {
   next();
 }
 else{
      res.status(400).send();
 }

}

const pp = x => JSON.stringify(x, null, 2);
//console.log(`>>>>>>>>>>> req.body is ${pp(req.body)}`); useless so far


//get employee
app.get('/api/employees', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee=1', (error, rows) =>{
      res.status(200).send({employees: rows});
    });
  });

//post employee 201
app.post('/api/employees',validateEmployee, (req, res, next) =>{
    db.run(`INSERT INTO Employee (name, position, wage, is_current_employee)
            VALUES($name,$position,$wage,$is_current_employee)`,{
              $name: req.body.employee.name,
              $position: req.body.employee.position,
              $wage: req.body.employee.wage,
              $is_current_employee: 1
            }, (error, row) => {
                  res.status(201).send({employee: row});
      });
    });

//get employee id
app.get('/api/employees/:employeeId', validateEmployee, (req, res, next) =>{
    db.get ('SELECT * FROM Employee WHERE id=$id',
    {$id: req.params.employeeId},
    (error, row) => {
    res.status(200).send({employee: row});
  });
    });


//put employee id
app.post ('/api/employees/:employeeId', (req, res, next) =>{
    db.run (`UPDATE Employee SET name=$name, position=$position, wage=$wage
     WHERE id=req.params.employeeId`,{
       $name: req.body.employee.name,
       $wage: req.body.employee.wage,
       $position: req.body.employee.position
     },
     (error, row) => {
       res.status(200).send({employee: row});
     });
   });

// delete
app.post('/api/employees/:employeeId', (req, res, next) => {
      db.run('UPDATE Employee  SET is_current_employee=0 WHERE id=$id',
      {$id: req.params.employeeId},  (error, row) =>{
      res.status(200).send({employee: row})
      });
  });

//get
app.get('/api/employees/:employeeId/timesheets', (req, res, next) =>{
        db.all('SELECT * FROM Timesheet WHERE employee_id=req.params.employeeId',
        (error, row) =>{
        res.status(200).send({timesheet: row})
      });
  });

//post 201
app.post ('/api/employees/:employeeId/timesheets', (req, res, next) =>{
      db.run (`INSERT INTO TimeSheet (hours, rate, date) VALUES (
        $hours, $rate, $date)`,
        {
          $hours: req.body.timesheet.hours,
          $rate: req.body.timesheet.rate,
          $date: req.body.timesheet.date
        },
        (error, row) =>{
        res.status(201).send({timesheet: row})
      });
    });

// get timesheet id
app.get('/api/employees/:employeeId/timesheets/:timesheetId',  (req, res, next) =>{
    db.all(`SELECT * FROM timesheet WHERE employee_id=$id`,
      {$id: req.params.timsheetId},
      (error, rows) =>{
      res.status(200).send({timesheet: rows})
    });
});

//put timesheet id
app.post ('/api/employees/:employeeId/timesheets/:timesheetId',  (req, res, next) =>{
      db.run(`UPDATE timesheet SET hours=$hours, rate=$rate, $date=date
      WHERE id=req.params.timesheetId`,
      {
        $hours: req.body.timesheet.hours,
        $rate: req.body.timesheet.rate,
        $date: req.body.timesheet.date
      },
      (error, row) =>{
      res.status(200).send({timesheet: row})
    });
});

//delete timesheet id
// still need to check for valid timesheet id
app.delete ('/api/employees/:employeeId/timesheets/:timesheetId',  (req, res, next) =>{
      db.run(`DELETE FROM timesheet WHERE id=$id`, {$id: req.params.timesheetId},
        (error, row) =>{
        res.status(200).send({timesheet: row})
      });
});


//get menu
app.get('/api/menus/',(req, res, next) =>{
    db.all(`SELECT * FROM Menu`,
      (error, rows) =>{
      res.status(200).send({menu: rows})
    });
});

//post menu 201
//still need to check for missing fields
app.post('/api/menus/',(req, res, next) =>{
    db.run(`INSERT INTO menu SET title=$title`,
    {
      $title: req.body.menu.title
    },
    (error, row) =>{
    res.status(201).send({menu: row})
  });
});

//get menu id
/*
GET
Returns a 200 response containing the menu with the supplied menu ID on the menu property of the response body
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/
app.get('/api/menus/:menuId',(req, res, next) =>{
    db.all(`SELECT * FROM Menu WHERE id=$id`,
      {$id: req.params.menuId},
      (error, row) =>{
      res.status(200).send({menu: row})
    });
});

//post menu id 201
//404 and 400 check not yet attempted
app.post('/api/menus/:menuId',(req, res, next) =>{
    db.run(`UPDATE menu SET title=$title WHERE id=$id`,
    {
      $title: req.body.menu.title,
      $id: req.params.menuId
    },
    (error, row) =>{
    res.status(201).send({menu: row})
  });
});


//delete menu id
app.post('/api/menus/:menuId',(req, res, next) =>{
    db.run('DELETE FROM menu WHERE id=req.params.id')
  });


app.get('/api/menus/:menuId/menu-items', (req, res, next) =>{
   db.all('SELECT * FROM menu item WHERE menu_id=menuId')
 });

 app.post('/api/menus/:menuId/menu-items', (req, res, next) =>{
   db.run(`INSERT INTO MenuItem (description, inventory, price)
   VALUES ($description, $inventory, $price)`),{
     $description: req.body.MenuItem.description,
     $inventory: req.body.MenuItem.inventory,
     $price:req.body.MenuItem.inventory
   }
 });

 app.post('/api/menus/:menuId/menu-items/:menuItemId',(req, res, next) =>{
   db.run(`UPDATE MenuItem SET description=$description, $inventory=inventory,
     price=$price WHERE id=menuItemId)`),{
       $description: req.body.MenuItem.description,
       $inventory: req.body.MenuItem.inventory,
       $price:req.body.MenuItem.inventory
     }
 });

 app.delete('/api/menus/:menuId/menu-items/:menuItemId',(req, res, next) =>{
   db.run('DELETE FROM MenuItem WHERE id=req.params.menuItemId')
 });

module.exports =app;
app.listen(PORT, () => {console.log('listening yay');})
