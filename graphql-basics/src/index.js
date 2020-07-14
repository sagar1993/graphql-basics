import {GraphQLServer} from 'graphql-yoga';
import uuidv4 from 'uuid/v4';

let users = [
    {
        id: 'abc',
        name: 'Sagar',
        email: 'test@t.com',
        age: 27,
    },
    {
        id: 'xyz',
        name: 'Def',
        email: 'test@v.com',
        age: 22,
    }
]

let posts = [
    {
        id: '1',
        title: 'a',
        body: 'a',
        published: true,
        author: 'xyz'
    },
    {
        id: '2',
        title: 'b',
        body: 'b',
        published: false,
        author: 'abc'
    },
    {
        id: '3',
        title: 'c',
        body: 'c',
        published: true,
        author: 'abc'
    }
]

let comments = [
    {
        id: 'c1',
        text: 'test1',
        author: 'abc',
        post: '1'
    },
    {
        id: 'c2',
        text: 'test2',
        author: 'xyz',
        post: '2'
    },
    {
        id: 'c3',
        text: 'test3',
        author: 'abc',
        post: '3'
    },
    {
        id: 'c4',
        text: 'test4',
        author: 'xyz',
        post: '1'
    }
]

// Scalar types : String Boolean Int Float ID
// ! = returns non null
// type definations (schema)


// Mutations allows create and update data
const typeDefs = `
    type Query {
        greeting(name: String): String!
        grades: [Int]!
        add(numbers: [Float!]!): Float!
        users(query: String): [User!]!
        me: User!
        posts(query: String): [Post!]!
        comments: [Comment!]!
    }

    type Mutation {
        createUser (data: CreateUserInput): User!
        deleteUser (id: ID!): User!
        createPost (data: CreatePostInput): Post!
        deletePost(id: ID!): Post!
        createComment (data: CreateCommentInput): Comment!
        deleteComment (id: ID!): Comment!
    }

    input CreateUserInput {
        name: String!
        email: String!
        age: Int
    }

    input CreatePostInput {
        title: String!
        body: String!
        published: Boolean!
        author: ID!
    }

    input CreateCommentInput {
        text: String!
        author: String!
        post: String!
    }

    type User {
        id: ID!
        name: String!
        email: String!
        age: Int!
        posts: [Post!]!
        comments: [Comment]!
    }

    type Post {
        id: ID!
        title: String!
        body: String!
        published: Boolean!
        author: User!
        comments: [Comment]!
    }

    type Comment {
        id: ID!
        text: String!
        author: User!
        post: Post!
    }
`;
// resolvers (functions run for various operations)
const resolvers = {
    Query: {

        // 4 arguments passed to resolver 
        // 1 parent - relational data
        // 2 args - information supplied
        // 3 context - contexual data
        // 4 info - information about operation

        greeting(parent, args, context, info) {
            return "Hello " + args.name + "!"
        },
        grades(parent, args, context, info) {
            return [99, 80, 93]
        },
        add(parent, args, context, info){
            return args.numbers.reduce((accum, current)=> {
                return accum + current
            }, 0);
        },
        me() {
            return {
                id: 'abc-xyz',
                name: 'Sagar',
                email: 'test',
                age: 27
            }
        },
        users(parent, args, context, info) {
            if (args.query) {
                return users.filter((user) => user.name.toLowerCase().includes(args.query.toLowerCase()))
            }
            return users
        },
        posts(parent, args, context, info) {
            if (args.query) {
                posts.filter((post) => {
                    isTitle = post.title.toLowerCase().includes(args.query.toLowerCase())
                    isBody = post.body.toLowerCase().includes(args.query.toLowerCase())
                    return isTitle || isBody
                })
            }
            return posts
        },
        comments(parent, args, context, info) {
            return comments
        }
    },
    Mutation: {
        createUser(parent, args, context, info) {
            const emailTaken = users.some((user) => user.email === args.data.email)
            if (emailTaken) {
                throw new Error('Email taken already');
            }
            const user = {
                id: uuidv4(),
                ...args.data
            }
            users.push(user)
            return user
        },
        deleteUser(parent,args,context,info) {
            const userIndex = users.findIndex((user) => user.id === args.id)
            if (userIndex === -1) {
                throw new Error('User not found')
            }
            // remove user
            const deletedUser = users.splice(userIndex, 1)
            // remove post
            posts = posts.filter((post) => {
                const match = post.author === args.id
                if (match) {
                    comments = comments.filter((comment) => {
                        return comment.post !== post.id
                    })
                }
                return !match
            })
            // remove comment
            comments = comments.filter((comment) => {
                return comment.author !== args.id
            })
            return deletedUser[0]
        },
        createPost(parent, args, context, info) {
            const userExists = users.some((user) => user.id === args.data.author)
            if (!userExists) {
                throw new Error('User not found')
            }
            const post = {
                id: uuidv4(),
                ...args.data
            }
            posts.push(post);
            return post
        },
        deletePost(parent, args, context, info) {
            const postIndex = posts.findIndex((post) => post.id === args.id)
            if (postIndex === -1) {
                throw new Error('Post not found')
            }
            const deletedPost = posts.splice(postIndex, 1)
            comments = comments.filter((comment) => comment.post !== post.id)
            return deletedPost[0]
        },
        createComment(parent, args, context, info) {
            const userExists = users.some((user) => user.id === args.data.author)
            const postExists = posts.some((post) => post.id === args.data.post)
            if (!userExists || !postExists) {
                throw new Error('user or post does not exists')
            }
            const comment = {
                id: uuidv4(),
                ...args.data
            }
            comments.push(comment)
            return comment
        },
        deleteComment(parent, args, context, info) {
            let commentIndex = comments.findIndex((comment) => comment.id === args.id)
            if (commentIndex === -1) {
                throw new Error('comment not found')
            }
            const deletedComment = comments.splice(commentIndex, 1)
            return deletedComment[0]
        }
    },
    Post: {
        author(parent, args, context, info) {
            return users.find((user) => user.id === parent.author)
        },
        comments(parent, args, context, info) {
            return comments.filter((comment) => comment.post === parent.id)
        }
    },
    User: {
        // graphQL relationships
        // define return type on typeDefs write respective resolver
        // achieve relationship using parent object
        posts(parent, args, context, info) {
            return posts.filter((post) => post.author === parent.id)
        },
        comments(parent, args, context, info) {
            return comments.filter((comment) => comment.author === parent.id)
        }
    },
    Comment: {
        // graphQL relationships
        // define return type on typeDefs write respective resolver
        // achieve relationship using parent object
        author(parent, args, context, info) {
            return users.find((user) => user.id === parent.author)
        },
        post(parent, args, context, info) {
            return posts.find((post) => post.id === parent.post)
        }
    }
}

const server = new GraphQLServer({
    typeDefs: typeDefs,
    resolvers: resolvers
});

server.start(() => {
    console.log("The server is running");
})