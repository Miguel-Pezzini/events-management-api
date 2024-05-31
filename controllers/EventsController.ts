import { PrismaClient } from '@prisma/client'
import { app } from '../app'
import { differenceInDays, differenceInMonths } from 'date-fns'

const prisma = new PrismaClient()

app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/register' || request.url === '/login') {
    return
  }
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

export async function create(request, reply) {
  const {
    quantityOfPeople,
    eventType,
    date,
    cost,
    isBuffet,
    isPhotography,
    isBand,
  } = request.body
  const userId = request.user.sub

  const dateOfEvent = new Date(date)
  const createdAt = new Date()

  const monthsDifference = differenceInMonths(dateOfEvent, createdAt)

  if (monthsDifference < 1) {
    return reply
      .code(400)
      .send('Date of event must be informed at least one month in advance')
  }

  if (monthsDifference === 1) {
    const daysDifference = differenceInDays(dateOfEvent, createdAt)

    if (daysDifference < 30) {
      return reply
        .code(400)
        .send('Date of event must be informed at least one month in advance')
    }
  }

  const event = await prisma.event.create({
    data: {
      userId,
      quantityOfPeople,
      eventType,
      date,
      cost,
      isBuffet,
      isPhotography,
      isBand,
    },
  })

  reply.code(201).send({ event })
}

export async function index(request, reply) {
  const userId = request.user.sub
  const events = await prisma.event.findMany({ where: { userId } })
  reply.code(200).send({ events })
}

export async function deleteEvent(request, reply) {
  const { id } = request.params
  const userId = request.user.sub
  const event: any = await prisma.event.findUnique({ where: { id } })

  if (userId !== event.userId) {
    return reply.code(401).send({
      message: 'USER NOT AUTHORIZED',
    })
  }

  if (!event) {
    return reply.code(404).send({
      message: 'this event does not exist anymore',
    })
  }

  await prisma.event.delete({ where: { id } })

  reply.code(202).send({
    message: 'Event deleted with success',
  })
}
