import { Context } from "@aws-appsync/utils";

export const createRequestEvent:Partial<Context> = {
  arguments: {
    input: {
      id: "",
      title: "The Cat in the hat!",
      authorId: "",
      publisherId: "12345",
      genres: ["Fiction"],
      publicationYear: 2007,
      image: "Hello, world!",
      description: "A Book about a cat wearing a hat!"
    }
  },
  source: {},
  result: {
    id: "",
    title: "The Cat in the hat!",
    authorId: "",
    publisherId: "12345",
    genres: [
      "Fiction"
    ],
    publicationYear: 2007,
    image: "Hello, world!",
    description: "A Book about a cat wearing a hat!"
  }
}

export const deleteRequestEvent:Partial<Context> = {
  arguments: {
    input: {
      title: "The Cat in the hat!",
    }
  },
  source: {},
  result: {
    id: "",
    title: "The Cat in the hat!",
    authorId: "",
    publisherId: "12345",
    publicationYear: 2007,
    image: "Hello, world!",
    description: "A Book about a cat wearing a hat!"
  }
}