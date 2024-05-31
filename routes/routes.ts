import { app } from '../app'
import { create, index, deleteEvent } from '../controllers/EventsController'
import { register, login, update } from '../controllers/UserController'

export async function getRoutes() {
  // User router
  app.post('/register', register)
  app.post('/login', login)
  app.put('/update/:id', update)
  // Events Router
  app.post('/createEvent', create)
  app.get('/index', index)
  app.delete('/delete/:id', deleteEvent)
}
