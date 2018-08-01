const express = require ('express');
const app = express();
const bodyParser = require ('body-parser');
const morgan = require ('morgan');

const sqlite3 = require ('sqlite3');
new sqlite3.Database(process.env.TEST_DATABASE || './db.sqlite');

const PORT = process.env.PORT || 4001;
const db = new sqlite3.Database(process.env.TEST_DATABASE || './db.sqlite');

app.use(express.static('public'));
app.use(morgan('dev'));
app.use(bodyParser.json());

 validateEmployee = (req, res, next) => {
  const test = req.body.employee;
  if (!test.name || !test.position || !test.wage) {
    res.status(400).send();
  }
  next();
}

app.get('/api/employees', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee=1', (error, rows) =>{
      res.status(200).send({Employees: rows});
    });
  });

app.post('/api/employees',validateEmployee, (req, res, next) =>{
    db.run(`INSERT INTO Employee (name, position, wage, is_current_employee)
            VALUES($name,$position,$wage,$is_current_employee)`,{
              $name: req.body.employee.name,
              $position: req.body.employee.position,
              $wage: req.body.employee.wage,
              $is_current_employee: 1
            }, (error, row) => {
                  res.sendStatus(200).send({Employee: row});
      });
    });


app.get('/api/employees/:employeeId', (req, res, next) =>{
    db.get ('SELECT * FROM Employee WHERE id=req.params.employeeId'),
    (error, row) => {
      if (error){
        res.sendStatus(400);
      }
      else {
          res.sendStatus(200).send({Employee: row});
      }
    }

  });
/*
app.post ('/api/employees/:employeeId', (req, res, next) =>
    db.run (`UPDATE Employee SET name=$name, position=$position, wage=$wage
     WHERE id=req.params.employeeId`),{
       $name: req.body.employee.name,
       $wage: req.body.employee.wage,
       $position: req.body.employee.position
     });
*/

////this is clearly wrong , need to chage is employed to 0 instead of axing row
app.delete('/api/employees/:employeeId', (req, res, next) => {
      db.run('DELETE FROM Employee WHERE id=req.params.employeeId')
    });

app.get('/api/employees/:employeeId/timesheets', (req, res, next) =>{
        db.all('SELECT * FROM Timesheet WHERE employee_id=req.params.employeeId')
      });

app.post ('/api/employees/:employeeId/timesheets', (req, res, next) =>{
      db.run (`INSERT INTO TimeSheet (hours, rate, date) VALUES (
        $hours, $rate, $date)`),
        {
          $hours: req.body.hours,
          $rate: req.body.rate,
          $date: req.body.date
        }
  });

app.post ('/api/employees/:employeeId/timesheets/:timesheetId',  (req, res, next) =>{
      db.run(`UPDATE timesheet SET hours=$hours, rate=$rate, $date=date
      WHERE id=req.params.timesheetId`),
      {
        $hours: req.body.hours,
        $rate: req.body.rate,
        $date: req.body.date
      }
});


app.delete ('/api/employees/:employeeId/timesheets/:timesheetId',  (req, res, next) =>{
      db.run('DELETE FROM timesheet WHERE id=req.params.timesheetId')
});

app.get('/api/menus/:menuId',(req, res, next) =>{
    db.get('SELECT * FROM menu WHERE id=req.params.menuId')
});

app.post('/api/menus/:menuId',(req, res, next) =>{
    db.run('UPDATE menu SET title=$title WHERE id=req.params.menuId'),
    {
      $title: req.body.title
    }
});


//only when it has no menu item-----hmmm
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
