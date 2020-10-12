import { randomBytes } from "crypto";

export class Observable<M extends EventMap> implements IObservable<M> {
    private _listeners: ListenerEntry<M>[] = [];

    on = (event: keyof M, listener: EventListener<M[typeof event]>) => {
        const key = randomBytes(16).join('');
        this._listeners.push({ event, listener, key });
        return key;
    };

    once = (event: keyof M, listener: EventListener<M[typeof event]>) => {
        const self = this;
        function listenOnce(args?: M[typeof event]) {
            self.removeListener(event, listenOnce);
            listener?.(args);
        }
        return this.on(event, listenOnce);
    };

    removeListener = (event: keyof M, handle: EventListener<M[typeof event]>) => {
        this._listeners = this._listeners.filter(le => !(le.event == event && (le.key == handle || le.listener == handle)));
        return true; // BAD
    };

    listeners = () => [...this._listeners];

    /**
     * 
     * @param event 
     * @param args 
     */
    protected emit(event: keyof M, args?: M[typeof event]) {
        this._listeners.forEach(le => le.event == event && le?.listener?.(args));
    }
}

/**
 * 
 */
export interface IObservable<M extends EventMap> {
    /**
     * Register an event listener.
     */
    on: (event: keyof M, listener: EventListener<M[typeof event]>) => any;

    /**
     * 
     */
    once: (event: keyof M, listener: EventListener<M[typeof event]>) => any;

    /**
     * 
     */
    removeListener: (event: keyof M, listener: EventListener<M[typeof event]>) => boolean;

    /**
     * 
     */
    listeners: () => ListenerEntry<M>[];
}

/**
 * 
 */
export type EventMap = {[key: string]: any}

/**
 * 
 */
export type EventListener<A> = (args?: A) => void; 

/**
 * 
 */
export type ListenerEntry<M, E extends keyof M = keyof M> = {
    listener: EventListener<M[E]>;
    event: E;
    key?: any;
}