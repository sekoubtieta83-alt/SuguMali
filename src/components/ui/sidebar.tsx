"use client"
import * as React from "react"
export function SidebarProvider({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function Sidebar({ children }: { children: React.ReactNode }) { return <aside>{children}</aside> }
export function SidebarTrigger() { return null }
export function SidebarInset({ children }: { children: React.ReactNode }) { return <main>{children}</main> }
export function SidebarContent({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
