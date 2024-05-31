import { PrismaClient } from '@prisma/client'
import { app } from '../app'
import { fastifyJwt } from '@fastify/jwt'
import { hash, compare } from 'bcrypt'
import { z } from 'zod'

app.register(fastifyJwt, {
  secret: 'supersecret',
})

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

const prisma = new PrismaClient()

export async function register(request, reply) {
  const userParse = z.object({
    name: z.string().max(50, { message: 'Must be under 50 characters long' }),
    email: z.string().email({ message: 'Must be an E-mail' }),
    password: z
      .string()
      .min(6, { message: 'Must be 6 or more characters long' }),
    cpf: z.string().min(11).max(14, { message: 'Must be a valid cpf' }),
  })

  const { name, email, password, cpf } = userParse.parse(request.body)

  const passwordHash = await hash(password, 6)

  const userCreated = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      cpf,
    },
  })

  reply.send({ userCreated })
}

export async function login(request, reply) {
  const { email, password } = request.body
  const user = await prisma.user.findUnique({ where: { email } })

  const isMatch = user && (await compare(password, user.passwordHash))

  if (!user || !isMatch) {
    return reply.code(401).send({
      message: 'Invalid email or password',
    })
  }

  const token = await reply.jwtSign(
    {},
    {
      sign: {
        sub: user.id,
      },
    },
  )

  return { token }
}

export async function update(request, reply) {
  const userParse = z.object({
    name: z.string().max(50, { message: 'Must be under 50 characters long' }),
    email: z.string().email({ message: 'Must be an E-mail' }),
    password: z
      .string()
      .min(6, { message: 'Must be 6 or more characters long' }),
    old_password: z.string(),
  })

  const { name, email, password, old_password } = userParse.parse(request.body)

  const { id } = request.params

  const user = await prisma.user.findUnique({ where: { id } })

  const isMatch = user && (await compare(old_password, user.passwordHash))

  if (!isMatch || !user) {
    return reply.code(401).send({
      message: 'Invalid credentials',
    })
  }

  const passwordHash = await hash(password, 6)

  const newUser = await prisma.user.update({
    where: {
      id,
    },
    data: {
      name,
      email,
      passwordHash,
    },
  })

  return { newUser }
}
