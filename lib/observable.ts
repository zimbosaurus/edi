/**
 * 
 */
export interface IObservable<M extends EventMap> {
    /**
     * Register an event listener.
     */
    on: (event: keyof M, listener: EventListener<M[typeof event]>) => void;

    /**
     * 
     */
    once: (event: keyof M, listener: EventListener<M[typeof event]>) => void;

    /**
     * 
     */
    removeListener: (event: keyof M, listener: EventListener<M[typeof event]>) => void;

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
export type ListenerEntry<M, E extends keyof M = keyof M> = { listener: EventListener<M[E]>; event: E; }