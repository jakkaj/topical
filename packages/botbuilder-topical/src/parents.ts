import { Topic, Topicable } from './topical';
import { BotContext } from 'botbuilder';

export interface TopicWithChildState {
    child?: string;
}

export abstract class TopicWithChild <
    Begin = any,
    State extends TopicWithChildState = TopicWithChildState,
    Return = any,
    Constructor = any,
    Context extends BotContext = BotContext, 
> extends Topic<Begin, State, Return, Constructor, Context> {

    public clearChild () {
        if (this.state.child) {
            Topic.deleteInstance(this.context, this.state.child);
            this.state.child = undefined;
        }
    }

    public setChild (
        childInstanceName: string,
    ) {
        if (this.state.child)
            this.clearChild();
        this.state.child = childInstanceName;
    }

    async beginChild <
        T extends Topicable<Begin, any, any, Constructor, Context>,
        Begin,
        Constructor,
    > (
        topicClass: T,
        beginArgs?: Begin,
        constructorArgs?: Constructor,
    ) {
        this.setChild(await (topicClass as any).begin(this, beginArgs, constructorArgs));
    }

    public hasChild () {
        return !!this.state.child;
    }

    public async dispatchToChild () {
        return this.dispatchTo(this.state.child);
    }

    public listChildren () {
        return this.state.child ? [this.state.child] : [];
    }
}

export interface TopicWithChildArrayState {
    children: string[];
}

export abstract class TopicWithChildArray <
    Begin = any,
    State extends TopicWithChildArrayState = TopicWithChildArrayState,
    Return = any,
    Constructor = any,
    Context extends BotContext = BotContext,
> extends Topic<Begin, State, Return, Context> {
    public async removeChild (
        child: string,
    ) {
        Topic.deleteInstance(this.context, child);
        this.state.children = this.state.children.filter(_child => _child !== child);
    }

    public async onBegin () {
        this.state.children = [];
    }

    public listChildren () {
        return this.state.children;
    }
}