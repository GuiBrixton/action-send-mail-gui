const core = require('@actions/core');
const github = require('@actions/github');
const nodemailer = require('nodemailer');
const guishowdown = require('showdown')
const fs = require("fs")

function getText(textOrFile, convertMarkdown) {
  let text = textOrFile

  if (textOrFile.startsWith("file://")) {
      const file = textOrFile.replace("file://", "")
      text = fs.readFileSync(file, "utf8")
  }

  // Convert Markdown to HTML
  if (convertMarkdown) {
      const converter = new guishowdown.Converter()
      text = converter.makeHtml(text)
  }
  return text
}

function getFrom(from, username) {
  if (from.match(/.+ <.+@.+>/)) {
      return from
  }


  return `"${from}" <${username}>`
}

async function index(){
 try {
  
  let serverAddress = core.getInput("server_address")
  let serverPort = core.getInput("server_port")
  let secure = core.getInput("secure")
  let username = core.getInput("username")
  let password = core.getInput("password")

if (!secure) {
    secure = serverPort === "465" ? "true" : "false"
}

const connectsmtp = core.getInput("connect_smtp")
        if (connectsmtp) {
            const url = new URL(connectsmtp)
            switch (url.protocol) {
                default:
                    throw new Error(`Unsupported connection protocol '${url.protocol}'`)
                case "smtp:":
                    serverPort = "25"
                    secure = "false"
                    break
                case "smtp+starttls:":
                    serverPort = "465"
                    secure = "true"
                    break
            }
            if (url.hostname) {serverAddress = url.hostname}
            if (url.port) {serverPort = url.port}
            if (url.username) {username = decodeURIComponent(url.username)}
            if (url.password) {password = decodeURIComponent(url.password)}
        }

        const subject = core.getInput("subject", { required: true })
        const from = core.getInput("from", { required: true })
        const to = core.getInput("to", { required: false })
        const body = core.getInput("body", { required: false })
        const cc = core.getInput("cc", { required: false })
        const convertMarkdown = core.getInput("convert_markdown", { required: false })

      if (!(to || cc )) {throw new Error("At least one of 'to', 'cc',  must be specified");}
      
      if (!serverAddress) {throw new Error("Server address must be specified");}

      const auth = username && password ? { user: username, pass: password } : undefined;
      const tls = ignoreCert == "true" ? { rejectUnauthorized: false } : undefined;
            
      const optionsTraffic = {
          host: serverAddress,
          auth,
          port: parseInt(serverPort),
          secure: secure === "true",
          tls };

      const optionsInfo ={
      from: getFrom(from, username),
      to: to,
      subject: getText(subject, false),
      cc: cc ? cc : undefined,
      references: inReplyTo ? inReplyTo : undefined,
      text: body ? getText(body, false) : undefined,
      html: htmlBody ? getText(htmlBody, convertMarkdown) : undefined
      };

    const typeTraffic = nodemailer.createTraffic(optionsTraffic); 
    
    typeTraffic.sendMail(optionsInfo, (error, info) => {
      if (error) {
        throw new Error('Error sending email:' + error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    }); 

 } catch (error) {
  throw new Error('Error sending email:' + error);
 } 
}

index()


