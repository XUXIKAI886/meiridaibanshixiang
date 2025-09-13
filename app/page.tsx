"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, EyeOff, Trash2, RotateCcw, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

interface TodoItem {
  id: string
  text: string
  completed: boolean
  hidden: boolean  // 是否隐藏（而非删除）
  createdAt: string
}

export default function DailyTodoApp() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [lastResetDate, setLastResetDate] = useState("")
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  // 检查是否需要重置任务（新的一天）
  useEffect(() => {
    const today = new Date().toDateString()
    const savedTodos = localStorage.getItem("dailyTodos")
    const savedResetDate = localStorage.getItem("lastResetDate")

    if (savedResetDate !== today) {
      // 新的一天，重置所有任务状态：未完成 + 恢复隐藏的任务
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos)
        const resetTodos = parsedTodos.map((todo: TodoItem) => ({
          ...todo,
          completed: false,  // 重置为未完成
          hidden: false,     // 恢复所有隐藏的任务
        }))
        setTodos(resetTodos)
        localStorage.setItem("dailyTodos", JSON.stringify(resetTodos))
      }
      setLastResetDate(today)
      localStorage.setItem("lastResetDate", today)
    } else {
      // 同一天，加载保存的任务
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos))
      }
      setLastResetDate(savedResetDate || today)
    }
  }, [])

  // 保存任务到本地存储
  const saveTodos = (updatedTodos: TodoItem[]) => {
    localStorage.setItem("dailyTodos", JSON.stringify(updatedTodos))
  }

  // 添加新任务
  const addTodo = () => {
    if (newTodo.trim()) {
      const newTodoItem: TodoItem = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        hidden: false,  // 新任务默认显示
        createdAt: new Date().toISOString(),
      }
      const updatedTodos = [...todos, newTodoItem]
      setTodos(updatedTodos)
      saveTodos(updatedTodos)
      setNewTodo("")
    }
  }

  // 切换任务完成状态
  const toggleTodo = (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (todo && !todo.completed) {
      // 如果是从未完成变为完成，触发庆祝动画
      setCelebratingId(id)
      setTimeout(() => setCelebratingId(null), 600)
    }
    
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    setTodos(updatedTodos)
    saveTodos(updatedTodos)
  }

  // 隐藏任务（而非删除，第二天会恢复）
  const hideTodo = (id: string) => {
    const updatedTodos = todos.map((todo) => 
      todo.id === id ? { ...todo, hidden: true } : todo
    )
    setTodos(updatedTodos)
    saveTodos(updatedTodos)
  }

  // 永久删除任务
  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id)
    setTodos(updatedTodos)
    saveTodos(updatedTodos)
  }

  // 手动重置所有任务
  const resetAllTasks = () => {
    const resetTodos = todos.map((todo) => ({ 
      ...todo, 
      completed: false,  // 重置完成状态
      hidden: false      // 恢复隐藏的任务
    }))
    setTodos(resetTodos)
    saveTodos(resetTodos)
    const today = new Date().toDateString()
    setLastResetDate(today)
    localStorage.setItem("lastResetDate", today)
  }

  // 处理回车键添加任务
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo()
    }
  }

  // 只统计显示的任务（非隐藏的任务）
  const visibleTodos = todos.filter((todo) => !todo.hidden)
  const completedCount = visibleTodos.filter((todo) => todo.completed).length
  const totalCount = visibleTodos.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/20 dark:to-purple-800/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-200/30 to-cyan-200/30 dark:from-indigo-800/20 dark:to-cyan-800/20 blur-3xl"></div>
      </div>
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                日拱一足
              </h1>
              <p className="text-muted-foreground text-lg">
                心外无物，此心光明
              </p>
            </div>
            
            {/* 进度圆环 */}
            {totalCount > 0 && (
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="url(#progress-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - completedCount / totalCount)}`}
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* 添加习惯 */}
        <Card className="mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="添加新的修身功课..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 pr-4 h-12 text-base bg-white/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-600/50 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200"
                />
                <Plus className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <Button 
                onClick={addTodo} 
                className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 animate-gradient"
              >
                <Plus className="h-5 w-5 mr-2" />
                添加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 习惯列表 */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-xl">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">{totalCount}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">今日功课</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    已完成 {completedCount} / {totalCount} 项
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllTasks}
                className="bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-600/50 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重置功课
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visibleTodos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Plus className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  开始你的修身之旅
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  制定每日功课，日积月累，终成大道
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleTodos.map((todo, index) => (
                  <div
                    key={todo.id}
                    className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                      todo.completed
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700/50"
                        : "bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-600/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg"
                    } ${celebratingId === todo.id ? 'animate-celebrate' : ''}`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: celebratingId === todo.id ? 'celebrate 0.6s ease-out' : 'fadeInUp 0.5s ease-out forwards'
                    }}
                  >
                    {/* 习惯序号 */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                      todo.completed 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* 复选框 */}
                    <div className="relative">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="w-6 h-6 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 border-2 transition-all duration-200"
                      />
                      {todo.completed && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* 习惯文本 */}
                    <span
                      className={`flex-1 text-lg transition-all duration-300 ${
                        todo.completed 
                          ? "line-through text-green-700 dark:text-green-400 opacity-75" 
                          : "text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                      }`}
                    >
                      {todo.text}
                    </span>
                    
                    {/* 完成状态指示 */}
                    {todo.completed && (
                      <div className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                        已完成
                      </div>
                    )}
                    
                    {/* 操作按钮组 */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      {/* 跳过按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => hideTodo(todo.id)}
                        className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full w-9 h-9 p-0"
                        title="今日跳过（明日恢复）"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                      
                      {/* 删除按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full w-9 h-9 p-0"
                        title="永久删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              每日自动重置 • 功课永不丢失 • 上次重置: {lastResetDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
