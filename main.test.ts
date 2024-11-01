import * as bdd from "jsr:@std/testing/bdd";
import * as ass from "jsr:@std/assert";
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

// bdd.describe("Test orgainseAssets & templater Fn", () => {
//     bdd.beforeAll(async () => {
//         await tmpDirOps("create");
//     });

//     bdd.it("Should copy assets", async () => {
//         const tmpDir = await tmpDirOps("log");
//         await cliFns.orgainseAssets(tmpDir, assets, "clitesting.com");
//         await cliFns.templater(tmpDir, "TST", "CLItesting", "clitesting.com");
//     });

//     bdd.it("Test k/v pairs in commons", async () => {
//         const commonsFileContent = Deno.readTextFileSync(
//             `${await tmpDirOps("log")}/config/common.ts`,
//         );

//         // Extract the object part from the file content
//         const objectPart = commonsFileContent.match(/{[\s\S]*}/)?.[0];
//         const commonVars = eval(`(${objectPart})`);

//         // Access the properties
//         const appCode = commonVars.APP_CODE;
//         const productName = commonVars.PRODUCTNAME;

//         // Assertions
//         xpt.expect(appCode).toBe("TST");
//         xpt.expect(productName).toBe("CLItesting");
//     });

//     bdd.afterAll(async () => {
//         console.log(await tmpDirOps("delete"));
//     });
// });

// bdd.describe("Child Process Spawning", () => {

//     // bdd.it("Should Check CDK version", async () => {
//     //     const res = await hlpFns.spawner("npx", ["aws-cdk", "--version"], Deno.cwd());
//     //     console.log(res.cp);
//     //     xpt.expect(res.success).toBe(true);
//     // })

//     bdd.it("Should handle package updates aws-cdk@x.x.x", async () => {
//         const res = await hlpFns.spawner("npx", ["aws-cdk", "--version"], Deno.cwd());
        
//     })
// });


// Deno.test({
//   name: "spawner - handles interactive CLI input",
//   async fn() {
//     // Create a test script that prompts for input
//     const mockScript = `
//       console.log("Need to install the following packages:");
//       const buf = new Uint8Array(1024);
//       const n = await Deno.stdin.read(buf);
//       const input = new TextDecoder().decode(buf.subarray(0, n)).trim();
//       console.log("Received input:", input);
//     `;

//     // Write temporary test script
//     const encoder = new TextEncoder();
//     const data = encoder.encode(mockScript);
//     await Deno.writeFile("test_script.js", data);

//     // Mock stdin
//     const mockInput = new TextEncoder().encode("y\n");
    
//     // Create a mock stdin reader that returns our predefined input
//     const mockStdin = {
//       read(_buf: Uint8Array): Promise<number | null> {
//         _buf.set(mockInput);
//         return Promise.resolve(mockInput.length);
//       },
//       close() {},
//     };

//     // @ts-ignore - Replacing stdin for testing
//     Deno.stdin = mockStdin;

//     try {
//       const { success, cp } = await hlpFns.spawner("deno", ["run", "test_script.js"]);
      
//       ass.assertEquals(success, true, "Process should complete successfully");
      
//       // Verify the output contains our input
//       const stdoutReader = cp.stdout.getReader();
//       const { value: stdoutValue } = await stdoutReader.read();
//       const stdoutText = new TextDecoder().decode(stdoutValue);
//       console.log('XXXXXX',stdoutText)
//       ass.assertEquals(
//         stdoutText.includes("Received input: y"),
//         true,
//         "Should capture and process CLI input"
//       );
//     } finally {
//       // Cleanup
//       await Deno.remove("test_script.js");
//     }
//   },
//   sanitizeResources: false,
//   sanitizeOps: false,
// });

Deno.test({
  name: "spawner - handle stdout/stdin ",
  async fn() {
    const testScript = `
    console.log("This is stdout")
    console.error("We are simulating an error in stderr")
    `
    const encoder = new TextEncoder()
    await Deno.writeFile('testScript.js', encoder.encode(testScript))

    try {
      const {cp, success} = await hlpFns.spawner('deno', ["run", "testScript.js"])

      // Assert that the CP was a success and that it returned something
      ass.assertEquals(success, true, "Spawned process returns success == true")
      ass.assertExists(cp, "Child process always return a value")

      //Verify that stdout contains the expected message
      const stdoutReader = cp.stdout.getReader()
      const {value: stdoutValue} = await stdoutReader.read()
      console.log('xxxx', stdoutValue)
      const stdoutText = new TextDecoder().decode(stdoutValue)
      ass.assertEquals(stdoutText.includes("stdout"), true)

    } catch (error) {
      console.error("Error in test", error)
    } finally {
      await Deno.remove('testScript.js')
    }
  },
})