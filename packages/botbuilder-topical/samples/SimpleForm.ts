import { Topic, TextPrompt, ValidatorResult } from '../src/topical';

export interface SimpleFormMetadata {
    type: string;
    prompt: string;
}

export interface SimpleFormSchema {
    [field: string]: SimpleFormMetadata;
}

export interface SimpleFormData {
    [field: string]: string;
}

export interface SimpleFormState {
    form: SimpleFormData;
    schema: SimpleFormSchema;
}

export interface SimpleFormReturn {
    form: SimpleFormData;
}

export class PromptForValue extends TextPrompt<string> {

    maxTurns = Number.MAX_SAFE_INTEGER;

    async prompter(result: ValidatorResult<string>) {
        await this.context.sendActivity(this.state.args);
    }
}

export class SimpleForm extends Topic<SimpleFormSchema, SimpleFormState, SimpleFormReturn> {
    
    static subtopics = [PromptForValue];

    async onBegin(
        args?: SimpleFormSchema,
    ) {
        this.state.schema = args!;
        this.state.form = {};

        await this.next();
    }

    async next () {
        for (const name of Object.keys(this.state.schema)) {
            if (!this.state.form[name]) {
                const metadata = this.state.schema[name];

                if (metadata.type !== 'string')
                    throw `not expecting type "${metadata.type}"`;

                await this.beginChild(PromptForValue, {
                    name,
                    args: metadata.prompt,
                });
                break;
            }
        }

        if (!this.hasChildren()) {
            this.returnToParent({
                form: this.state.form
            });
        }
    }

    async onTurn() {
        if (!await this.dispatchToChild())
            throw "a prompt should always be active";
    }

    async onChildReturn(
        child: PromptForValue,
    ) {

        const metadata = this.state.schema[child.return!.name];

        if (metadata.type !== 'string')
            throw `not expecting type "${metadata.type}"`;

        this.state.form[child.return!.name] = child.return!.result.value!;
        this.clearChildren();

        await this.next();
    }
}
