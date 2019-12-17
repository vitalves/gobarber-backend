import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    // pode se usar tipos primitivos do JS (String, Number, Boolean, Array)
    content: {
      type: String,
      required: true,
    },
    user: {
      type: Number,
      required: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', NotificationSchema);
// com o mongoose o model pode ser impotado diretamente e ser utilizado;
