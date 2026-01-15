import { type ClassValue, clsx } from "clsx";
import { MediaQuery } from "svelte/reactivity";
import { twMerge } from "tailwind-merge";

const MOBILE_BREAKPOINT = 768;

export const isMobile = new MediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`, false);

export const isMac = navigator.userAgent.includes("Mac");

export const collapseFilename = (f: string) =>
	f.length < 25 ? f : `${f.slice(0, 10)}...${f.slice(-10)}`;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};
