const YAML = require("js-yaml");
const fs = require("fs");
const jsonfs = require("jsonfile");
const path = require("path");

const DEFAULT_FMTOOL_PATH = "./fmt/"

const JSON_SETTINGS = {
    spaces: 4
}


/*
    lmao thx stackoverflow
    https://stackoverflow.com/a/24594123
*/
const getDirectories = source => fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const getFiles = source => fs.readdirSync(source, {withFileTypes: true})
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);


class FMConfig {

    #data = {}

    constructor(){
        this.#data = {
            factories: {},
            recipes: {}
        }
    }

    // yaml object
    get data(){
        return this.#data;
    }

    // yaml string
    get string(){
        return YAML.dump(this.#data);
    }

    // parse the yaml data from the config.yml file
    parseYaml(filePath, yamlData){
        this.#data.factories = yamlData.factories;
        this.#data.recipes = yamlData.recipes;
        const extraData = {}
        for(let key in yamlData){
            if(key === "factories" || key === "recipes"){
                continue;
            }
            extraData[key] = yamlData[key];
            this.#data[key] = yamlData[key];
        }

        const fmFilePath = path.resolve(filePath, "factorymod.json");
        jsonfs.writeFileSync(fmFilePath, extraData, JSON_SETTINGS);

        for(let factoryKey in this.#data.factories){
            const factory = this.#data.factories[factoryKey];

            const factoryFolderPath = path.resolve(filePath, factoryKey);
            if(!fs.existsSync(factoryFolderPath)){
                fs.mkdirSync(factoryFolderPath, {recursive: true})
            }

            const factoryFilePath = path.resolve(factoryFolderPath, "factory.json");
            const factObj = Object.keys(factory)
                .filter((key) => key !== "recipes")
                .reduce((cur, key) => {return Object.assign(cur, {[key]: factory[key]})}, {});
            jsonfs.writeFileSync(factoryFilePath, factObj, JSON_SETTINGS);

            if(factory.recipes){
                const recipeFolderPath = path.resolve(filePath, factoryKey, "recipes")
                if(!fs.existsSync(recipeFolderPath)){
                    fs.mkdirSync(recipeFolderPath);
                }

                for(let recipeKey of factory.recipes){
                    const recipe = this.#data.recipes[recipeKey];

                    if(recipe === undefined){
                        console.log(`Found recipe '${recipeKey}' for '${factoryKey}' that did not exist.`);
                        continue;
                    }

                    const recipePath = path.resolve(recipeFolderPath, `${recipeKey}.json`);

                    jsonfs.writeFileSync(recipePath, recipe, JSON_SETTINGS);
                }
            }
        }
    }

    // read file/folder structure and build #data
    buildYaml(filePath){
        if(!fs.existsSync(filePath) || !fs.lstatSync(filePath).isDirectory()){
            console.log(`Failed to find folder at path '${p}'`);
            return;
        }

        const extraData = jsonfs.readFileSync(path.resolve(filePath, "factorymod.json"))
        for(let key in extraData){
            if(key === "factories" || key === "recipes"){
                continue;
            }
            this.#data[key] = extraData[key];
        }

        const factories = getDirectories(filePath);
        for(let factoryKey of factories){
            const factoryFolderPath = path.resolve(filePath, factoryKey)
            const factoryFilePath = path.resolve(factoryFolderPath, "factory.json");
            if(!fs.existsSync(factoryFolderPath) || !fs.existsSync(factoryFilePath)){
                continue;
            }

            const factory = jsonfs.readFileSync(factoryFilePath)
            this.#data.factories[factoryKey] = factory;

            const factoryRecipesPath = path.resolve(factoryFolderPath, "recipes");
            const recipeFiles = getFiles(factoryRecipesPath).map(val => val.replace(/\.[^/.]+$/, ""))
            if(recipeFiles.length < 1){
                continue;
            }

            factory.recipes = []
            for(let recipeKey of recipeFiles){
                const recipeFilePath = path.resolve(factoryRecipesPath, `${recipeKey}.json`);
                const recipeObj = jsonfs.readFileSync(recipeFilePath);
                this.#data.recipes[recipeKey] = recipeObj
                factory.recipes.push(recipeKey)
            }
        }
    }


}

class FactoryModTool {
    
    #config;

    constructor(){
        this.#config = new FMConfig();
    }

    decompile(filePath){
        if(!fs.existsSync(filePath)){
            fs.mkdirSync(filePath);
        }

        const p = path.resolve(filePath, "config.yml");
        if(!fs.existsSync(p)){
            console.log(`Failed to find file at path '${p}'`);
            return;
        }

        const data = fs.readFileSync(p, "utf-8");
        const yamlData = YAML.load(data);
        this.#config.parseYaml(filePath, yamlData);
        console.log(`Finished creating folder structure from config file at '${p}'`)
    }

    compile(filePath){
        if(!fs.existsSync(filePath) || !fs.lstatSync(filePath).isDirectory()){
            console.log(`Failed to find folder at path '${filePath}'`);
            return;
        }

        this.#config.buildYaml(filePath);
        const outputData = this.#config.string;
        const outputFile = path.resolve(filePath, "output.yml");
        fs.writeFileSync(outputFile, outputData);
        console.log(`Written output file to ${outputFile}`)
    }

}

module.exports = {
    FactoryModTool: FactoryModTool,
    DEFAULT_FMTOOL_PATH: DEFAULT_FMTOOL_PATH
};