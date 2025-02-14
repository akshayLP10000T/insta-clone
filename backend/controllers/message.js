import {Conversation} from '../models/conversation.js'
import {Message} from '../models/message.js'
import { getReceiverSocketId, io } from '../socket/socket.js';

export const sendMessage = async(req, res)=>{
    try {
        const senderId = req.id;
        const receiverId = req.params.id;

        const { message } = req.body;

        let conversation = await Conversation.findOne({
            participants: {
                $all: [senderId, receiverId],
            }
        });

        if(!conversation){
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            })
        };

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message: message,
        });

        if(newMessage) conversation.messages?.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()])

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.status(201).json({
            success: true,
            newMessage: newMessage,
        })

    } catch (error) {
        console.error(error);
    }
};

export const getMessage = async (req, res)=>{
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const conversation = await Conversation.find({
            participants: {$all: [senderId, receiverId]},
        });

        if(!conversation) return res.status(200).json({
            success: true,
            messages: [],
        });

        return res.status(200).json({
            success: true,
            messages: conversation?.messages,
        });

    } catch (error) {
        console.error(error);
    }
}