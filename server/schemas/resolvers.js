const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        users: async () => {
            return User.find().populate('thoughts');
        },
        user: async (parent, { username }) => {
            return User.findOne({ username }).populate('thoughts');
        },
        books: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Book.find(params);
        },
        book: async (parent, { bookId }) => {
            return Book.findOne({_id: bookId });
        },
    },

    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
                const token = signToken(user);
                return { token, user };
            },
            login: async (parent, { email, password }) => {
                const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('No email address found');
            }
            
            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect password');
            }

            const token = signToken(user);
            return { token, user };
            },
            addBook: async (parent, { description }, context) => {
                if(context.user) {
                    const book = await Book.create({
                        description, 
                        author: context.user.username,
                    });

                await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { books: book._id } }
                );

                return book;
                }
                throw new AuthenticationError('Login required!');
            },
            removeBook: async (parent, { bookId }, context) => {
                if(context.user) {
                    const book = await Book.findOneAndDelete({
                        _id: bookId,
                        author: context.user.username,
                    });

                    await User.findOneAndUpdate(
                        { _id: context.user._id },
                        { $pull: { books: book._id } }
                    );
                    return book;
                }
                throw new AuthenticationError('Login required!');
            },
        },
    };

    module.exports = resolvers;