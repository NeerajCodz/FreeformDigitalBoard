import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test if Label and Group models exist
const testLabel = async () => {
  const labels = await prisma.label.findMany()
  return labels
}

const testGroup = async () => {
  const groups = await prisma.group.findMany()
  return groups
}

// Test if boardId field exists
const testLabelFields = async () => {
  const label = await prisma.label.findFirst({
    where: {
      boardId: 'test'
    }
  })
  return label
}
