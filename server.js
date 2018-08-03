const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const PORT = process.env.PORT || 4001;


app.use(express.static('public'));
app.use(morgan('dev'));
app.use(bodyParser.json());


// handle :employeeId parameters
app.param('employeeId', (req, res, next, id) => {
    db.get(`SELECT * FROM Employee WHERE id = $id`, {
            $id: id
        },
        (error, row) => {
            if (error) {
                next(error);
            } else if (row) {
              req.employee=row;
                next();
            } else {
                res.status(404).send();
            }
        });
});

app.param('timesheetId', (req, res, next, id) => {
    db.get(`SELECT * FROM Timesheet WHERE id = $id`, {
            $id: id
        },
        (error, row) => {
            if (error) {
                next(error);
            } else if (row) {
              req.timesheet=row;
                next();
            } else {
                res.status(404).send();
            }
        });
});

app.param('menuId', (req, res, next, id) => {
    db.get(`SELECT * FROM Menu WHERE id = $id`, {
            $id: id
        },
        (error, row) => {
            if (error) {
                next(error);
            } else if (row) {
              req.menuId=row;
                next();
            } else {
                res.status(404).send();
            }
        });
});

app.param('menuItemId', (req, res, next, id) => {
    db.get(`SELECT * FROM MenuItem WHERE id = $id`, {
            $id: id
        },
        (error, row) => {
            if (error) {
                next(error);
            } else if (row) {
              req.menuItemId=row;
                next();
            } else {
                res.status(404).send();
            }
        });
});

const validateEmployee = (req, res, next) => {
    const emp = req.body.employee;
    if (emp.name && emp.position && emp.wage) {
        next();
    } else {
        res.status(400).send();
    }
}

const validateTimesheet = (req, res, next) => {
  const time=req.body.timesheet;
  if (time.hours && time.rate && time.date){
    next();
  }
  else{
    res.status(400).send();
  }
}


const validateMenu = (req, res, next) => {
  if(req.body.menu.title){
    next();
  }
  else{
    res.status(400).send();
  }
}

//get employee
app.get('/api/employees', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee=1', (error, rows) => {
        res.status(200).send({
            employees: rows
        });
    });
});

//get employee id
app.get('/api/employees/:employeeId', (req, res, next) => {
    db.get(`SELECT * FROM Employee WHERE id = $id`, {
          $id: req.params.employeeId
        },
        (error, row) => {
            if (error) {
                next(error);
            } else  {
                res.status(200).send({ employee: row });
            }
        });
});

//post employee 201
app.post('/api/employees', validateEmployee, (req, res, next) => {
   db.run(`INSERT INTO Employee (name, position, wage)
           VALUES ($name, $position, $wage)`, {
             $name: req.body.employee.name,
             $position: req.body.employee.position,
             $wage: req.body.employee.wage,
         }, function(error) {
               if (error) {
                   next(error);
               } else {
                   db.get(`SELECT * FROM Employee WHERE id=$id`,
                          {$id: this.lastID},
                          (error, row) => {
                              res.status(201).send({employee: row});
                          });
               }
         });
});


//put employee id
app.put('/api/employees/:employeeId', validateEmployee, (req, res, next) => {
    db.run(`UPDATE Employee SET name=$name, position=$position, wage=$wage
     WHERE id=$id`, {
            $name: req.body.employee.name,
            $position: req.body.employee.position,
            $wage: req.body.employee.wage,
            $id: req.params.employeeId
        },
        function(error){
          if (error){
          next(error);
          }
          else{
            db.get(`SELECT * FROM Employee WHERE id = $id`,
              {$id: req.employee.id},
            (error, row) => {
            res.status(200).send({employee: row});
          });
        }
    });
});

// delete
app.delete('/api/employees/:employeeId', (req, res, next) => {
    db.run('UPDATE Employee  SET is_current_employee=0 WHERE id=$id', {
        $id: req.params.employeeId
    }, function(error){
      if (error)
      next(error);
      else{
        db.get(`SELECT * FROM Employee WHERE id=$id`,
          {$id: req.employee.id},
         (error, row) =>{
        res.status(200).send({employee: row});
      });
      }
    });
});




//get
app.get('/api/employees/:employeeId/timesheets', (req, res, next) => {
    db.all(`SELECT * FROM Timesheet WHERE employee_id=$id`, {
            $id: req.params.employeeId
        },
        (error, rows) => {
            res.status(200).send({timesheets: rows});
        });
});


const pp = x => JSON.stringify(x, null, 2);
//console.log(`>>>>>>>>>>> req.body is ${pp(req.body)}`); useless so far

//post 201
app.post('/api/employees/:employeeId/timesheets', (req, res, next) => {
    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES (
        $hours, $rate, $date, $emdId)`, {
            $hours: req.body.timesheet.hours,
            $rate: req.body.timesheet.rate,
            $date: req.body.timesheet.date,
            empId: req.params.employeeId
        },
          function(error) {
          if (error){
            next(error);
          }
          else{
            console.log(`>>>>>>>>>>> req.body is ${pp(req.body)}`);
            console.log(`>>>>>>>>>>> this.lastID is ${pp(this.lastID)}`);
            db.get(`SELECT * FROM Timesheet WHERE id=$id`,
              {$id: this.lastID},
            (error, row) => {
            res.status(201).send({timesheet: row});
        });
      }
    });
});

//put timesheet id
app.put('/api/employees/:employeeId/timesheets/:timesheetId', validateTimesheet, (req, res, next) => {
    db.run(`UPDATE timesheet SET hours=$hours, rate=$rate, date=$date
      WHERE id=$id`, {
            $hours: req.body.timesheet.hours,
            $rate: req.body.timesheet.rate,
            $date: req.body.timesheet.date,
            $id: req.params.timesheetId
        },
        function(error){
          if (error){
            next(error);
          }
          else{
            db.get(`SELECT * FROM Timesheet WHERE id=$id`,
              {$id:req.timesheet.id},
              (error, row) => {
                if(row){
            res.status(200).send({timesheet: row});
          }
          else{
            res.status(404).send();
          }
            });
          }
      });
});

//delete timesheet id
app.delete('/api/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
    db.run(`DELETE FROM Timesheet WHERE id=$id`, {
            $id: req.params.timesheetId
        },
        (error, row) => {
            res.status(204).send();
        });
});


//get menu
app.get('/api/menus/', (req, res, next) => {
    db.all(`SELECT * FROM Menu`,
        (error, rows) => {
          if (error){
            next(error);
          }
          else{
            res.status(200).send({menus: rows});
          }
        });
});

//post menu 201
app.post('/api/menus/', validateMenu, (req, res, next) => {
    db.run(`INSERT INTO menu SET title=$title`, {
            $title: req.body.menu.title
        },
        function(error) {
          if (error){
            next(error);
          }
          else{
            db.get(`SELECT * FROM Menu WHERE id=$id`,
            {id: this.lastID},
                (error, row) =>{
                {res.status(201).send({menu: row});}
              });
          }
    });
});


//get menu id
app.get('/api/menus/:menuId', (req, res, next) => {
    db.get(`SELECT * FROM Menu WHERE id=$id`, {
            $id: req.params.menuId
        },
        (error, row) => {
            res.status(200).send({menu: row});
        });
});

//post menu id 201
//404 and 400 check not yet attempted
app.post('/api/menus/:menuId', (req, res, next) => {
    db.run(`UPDATE menu SET title=$title WHERE id=$id`, {
            $title: req.body.menu.title,
            $id: req.params.menuId
        },
        (error, row) => {
            res.status(201).send({
                menu: row
            });
        });
});


//delete menu id
app.post('/api/menus/:menuId', (req, res, next) => {
    db.run(`DELETE FROM menu WHERE id=$id`, {
            id: req.params.id
        },
        (error, row) => {
            res.status(200).send({
                menu: row
            });
        });
});

//get menu items
app.get('/api/menus/:menuId/menu-items', (req, res, next) => {
    db.all(`SELECT * FROM menu item WHERE menu_id=$id`, {
            $id: req.params.menuId
        },
        (error, rows) => {
            res.status(200).send({
                menu: rows
            });
        });
});

//post 201 menu items
app.post('/api/menus/:menuId/menu-items', (req, res, next) => {
    db.run(`INSERT INTO MenuItem (description, inventory, price)
   VALUES ($description, $inventory, $price)`, {
            $description: req.body.MenuItem.description,
            $inventory: req.body.MenuItem.inventory,
            $price: req.body.MenuItem.inventory
        },
        (error, row) => {
            res.status(201).send({
                menu: row
            });
        });
});

//menu item id put
app.put('/api/menus/:menuId/menu-items/:menuItemId', (req, res, next) => {
    db.run(`UPDATE MenuItem SET description=$description, $inventory=inventory,
     price=$price WHERE id=$id`, {
            $description: req.body.MenuItem.description,
            $inventory: req.body.MenuItem.inventory,
            $price: req.body.MenuItem.inventory,
            $id: req.params.menuItemId
        },
        (error, row) => {
            res.status(200).send({menu: row});
        });
});

/*menu item delete 204
app.delete('/api/menus/:menuId/menu-items/:menuItemId', (req, res, next) => {
db.serialize(() =>{
  returnRow = (db.get(`SELECT * `))
    db.run(`DELETE FROM MenuItem WHERE id=$id`, {
            $id: req.params.menuItemId
        },
        (error, row) => {
            res.status(204).send({
                menu: row
            });
        });
});
});
*/

module.exports = app;
app.listen(PORT, () => {
    console.log('listening yay');
});
