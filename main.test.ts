import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { ASSETS_DIR } from "./main.ts";
import {assert} from "jsr:@std/assert";

describe("File Generation and Templating", () => {
    const folders = [...Deno.readDirSync(`${Deno.cwd()}/assets/template`)]

    it("Array contains Files and Folders", () => {
        expect(folders.length).toBeGreaterThan(1);

        for (const dir of folders){
            console.log(dir.name, dir.isFile)
            expect(dir).toHaveProperty("name");
            expect(dir).toHaveProperty("isFile");
            expect(dir).toHaveProperty("isDirectory");
            expect( typeof dir.name).toBe("string");
            expect( typeof dir.isFile).toBe("boolean");
            expect( typeof dir.isDirectory).toBe("boolean");
        }
    })

});

describe("CLI Arguments", () => {
    const args = Deno.args;
    console.log(args)
    it("Check Domain name (-d)", () => {
        assert(args.includes("-d"));
    })
    it("Check AppName (-a)", () => {
        assert(args.includes("-a"));
    })
    it("Check AppCode (-c)", () => {
        assert(args.includes("-c"));
    })
})