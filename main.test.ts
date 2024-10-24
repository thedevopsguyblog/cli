import * as bdd from "jsr:@std/testing/bdd";
import * as xpt from "jsr:@std/expect";
import * as cliFns from "./main.ts";
import * as hlpFns from "./helpers.ts";

const tmpDirOps = async (
    option: "create" | "delete" | "log",
): Promise<string> => {
    const folderPath = "wus-cli-test";
    let dirPath = "";

    switch (option) {
        case "create": {
            Deno.mkdirSync(folderPath)

            for (const d of Deno.readDirSync(Deno.cwd())) {
                if (d.isDirectory && folderPath.match(d.name)) {
                    dirPath = d.name;
                }
            }
            return dirPath;
        }

        case "delete": {
            const deletedFolders = [];
            for (const d of Deno.readDirSync(Deno.cwd())) {
                if (d.isDirectory && folderPath.match(d.name)) {
                    deletedFolders.push(d.name);
                }
            }

            deletedFolders.forEach((f) => {
                console.log(`Deleting ${f}`);
                Deno.removeSync(f, { recursive: true });
            });
            return "Deleted workspace";
        }

        case "log": {
            for (const d of Deno.readDirSync(Deno.cwd())) {
                if (d.isDirectory && folderPath.match(d.name)) {
                    dirPath = d.name;
                }
            }

            return dirPath;
        }

        default:
            console.error("Pass an option");
            Deno.exit(1);
    }
};

const assets = "./assets";

bdd.describe("Test orgainseAssets & templater Fn", () => {
    bdd.beforeAll(async () => {
        await tmpDirOps("create");
    });

    bdd.it("Should copy assets", async () => {
        const tmpDir = await tmpDirOps("log");
        await cliFns.orgainseAssets(tmpDir, assets);
        await cliFns.templater(tmpDir, "TST", "CLItesting", "clitesting.com");
    });

    bdd.it("Test k/v pairs in commons", async () => {
        const commonsFileContent = Deno.readTextFileSync(
            `${await tmpDirOps("log")}/config/common.ts`,
        );

        // Extract the object part from the file content
        const objectPart = commonsFileContent.match(/{[\s\S]*}/)?.[0];
        const commonVars = eval(`(${objectPart})`);

        // Access the properties
        const appCode = commonVars.APP_CODE;
        const productName = commonVars.PRODUCTNAME;

        // Assertions
        xpt.expect(appCode).toBe("TST");
        xpt.expect(productName).toBe("CLItesting");
    });

    bdd.afterAll(async () => {
        console.log(await tmpDirOps("delete"));
    });
});

bdd.describe("Test CLI Args", () => {
    
})

bdd.describe("Test NPM Install process", () => {
    bdd.beforeAll(async () => {
        await tmpDirOps("create");
    })
    
    bdd.it("Should spawn a process", async () => {
        const tmpDir = await tmpDirOps("log");
        const installCmd = await hlpFns.npmInstall(tmpDir, "glob");
        console.log(installCmd);
    });


    bdd.afterAll(async () => {
        console.log(await tmpDirOps("delete"));
    });
});
