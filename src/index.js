const args = require("args");
const Tool = require("./tool");
args.option("decompile", "Decompiles a YAML file into the FactoryMod Tool folder structure")
args.option("compile", "Compiles the FactoryMod Tool folder structure into a single YAML file")
args.option("folder", "The file or folder to perform the operation on.")


function init(){
    const tool = new Tool.FactoryModTool();

    const flags = args.parse(process.argv)

    if(flags.compile){
        const path = typeof(flags.folder) === "string" ? flags.folder : Tool.DEFAULT_FMTOOL_PATH;
        tool.compile(path);
        return;
    }else if(flags.decompile){
        const path = typeof(flags.folder) === "string" ? flags.folder : Tool.DEFAULT_FMTOOL_PATH;
        tool.decompile(path);
        return;
    }

    tool.decompile(Tool.DEFAULT_FMTOOL_PATH);
}

init();