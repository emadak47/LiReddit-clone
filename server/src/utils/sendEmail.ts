import nodemailer from "nodemailer";

// simple email text
// could create a template for the email 
// check their docs for more info 
export async function sendEmail(to: string, html: string) {
    // use this once then console.log to get email address & pasword 
    // hardcode the email and pass to avoid spamming their server 
    // let testAccount = await nodemailer.createTestAccount(); 
    // console.log("testAccount", testAccount);

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587, 
        secure: false, // true for 465, false for other ports 
        auth: {
            user: "xyf5m523muzgw6l3@ethereal.email", // hardcoded
            pass: "dcydQm4vM1jx8C8C9W" //hardcoded
        }
    })

    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>', // sender address
        to: to, // list of receivers
        subject: "Change Password", // Subject line
        html,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}