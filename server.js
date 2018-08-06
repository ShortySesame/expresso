const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const PORT = process.env.PORT || 4000;


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
              req.menu=row;
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
              req.menuItem=row;
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

const validateMenuItems = (req, res, next) => {
  const item=req.body.menuItem;
  if(item.name && item.inventory && item.price){
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

// delete employee id
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




//get timesheets
app.get('/api/employees/:employeeId/timesheets', (req, res, next) => {
    db.all(`SELECT * FROM Timesheet WHERE employee_id=$id`, {
            $id: req.params.employeeId
        },
        (error, rows) => {
            res.status(200).send({timesheets: rows});
        });
});


//post 201
app.post('/api/employees/:employeeId/timesheets',validateTimesheet, (req, res, next) => {
    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES (
        $hours, $rate, $date, $empId)`, {
            $hours: req.body.timesheet.hours,
            $rate: req.body.timesheet.rate,
            $date: req.body.timesheet.date,
            $empId: req.params.employeeId
        },
          function(error) {
          if (error){
            next(error);
          }
          else{
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
    db.run(`INSERT INTO Menu (title) VALUES ($title)`, {
            $title: req.body.menu.title
        },
        function(error) {
          if (error){
            next(error);
          }
          else{
            db.get(`SELECT * FROM Menu WHERE id=$id`,
            {$id: this.lastID},
                (error, row) =>{
                res.status(201).send({menu: row});
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

//put menu id 201
app.put('/api/menus/:menuId',validateMenu, (req, res, next) => {
    db.run(`UPDATE Menu SET title=$title WHERE id=$id`, {
            $title: req.body.menu.title,
            $id: req.params.menuId
        },
        function(error) {
          if (error){
            next(error);
          }
            else{
              db.get(`SELECT * FROM Menu WHERE id=$id`,
              {$id: req.menu.id},
              (error, row) => {
                res.status(200).send({menu: row});
              });
            }
      });
});


//delete menu id
app.delete('/api/menus/:menuId', (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE menu_id=$id`,
    {$id: req.params.menuId},
    (error, row) => {
      if (error){
        next(error);
      }
      else if (row){
    res.status(400).send();
      }
      else{
      db.run(`DELETE FROM Menu WHERE id=$id`,
            {$id: req.params.menuId},
            (error, row) => {
              if (error){
                next(error);
              }
              else{
              res.status(204).send();
          }
      });
    }
  });
});

//get menu items
app.get('/api/menus/:menuId/menu-items', (req, res, next) => {
    db.all(`SELECT * FROM MenuItem WHERE menu_id=$id`, {
            $id: req.params.menuId
        },
        (error, rows) => {
          if (error){
            next(error);
          }
          else{
            res.status(200).send({menuItems: rows});
          }
        });
});


//post 201 menu items
app.post('/api/menus/:menuId/menu-items', validateMenuItems, (req, res, next) => {
   db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id)
   VALUES ($name, $description, $inventory, $price, $menuId)`, {
            $name: req.body.menuItem.name,
            $description: req.body.menuItem.description,
            $inventory: req.body.menuItem.inventory,
            $price: req.body.menuItem.price,
            $menuId: req.params.menuId
        },
        function(error) {
            if (error){
              next(error);
            }
        else{
          db.get(`SELECT * FROM MenuItem WHERE id=$id`,
          {$id: this.lastID},
          (error, row) => {
            res.status(201).send({menuItem: row});
        });
      }
    });
});


//menu item id put
app.put('/api/menus/:menuId/menu-items/:menuItemId', validateMenuItems, (req, res, next) => {
    db.run(`UPDATE MenuItem SET name=$name, description=$description, inventory=$inventory,
     price=$price, menu_id=$menuId WHERE id=$id`, {
            $name: req.body.menuItem.name,
            $description: req.body.menuItem.description,
            $inventory: req.body.menuItem.inventory,
            $price: req.body.menuItem.price,
            $menuId: req.params.menuId,
            $id: req.params.menuItemId
        },
        function(error) {
          if (error){
            next(error);
          }
          else{
          db.get(`SELECT * FROM MenuItem WHERE id=$id`,
            {$id: req.menuItem.id},
            (error, row) => {
            res.status(200).send({menuItem: row});
          });
        }
      });
});

//menu item delete 204
app.delete('/api/menus/:menuId/menu-items/:menuItemId', (req, res, next) =>{
    db.run(`DELETE FROM MenuItem WHERE id=$id`,
            {$id: req.params.menuItemId},
        (error, row) => {
          if (error) {
            next(error);
          }
          else{
            res.status(204).send();
          }
    });
});


module.exports = app;
app.listen(PORT, () => {
    console.log('listening port 4000');
});
