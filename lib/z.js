require("./utils/loop");

const Session = require("./manager/manager");

"#if DEBUG";
    console.log("DEBUG IS ON!!");
"#endif";

module.exports = Session;
