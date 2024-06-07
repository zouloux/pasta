import { readFileSync, writeFileSync, existsSync } from "fs"

const port = 3000
const tasksFilePath = "/root/data/tasks.json"

async function fetch(request) {
	const url = new URL(request.url)
	if (url.pathname === "/") {
		const tasks = getTasks()
		const taskList = tasks.map(task => `
      <li>
        ${task.name}
        <form method="POST" action="/delete-task" style="display:inline">
          <input type="hidden" name="id" value="${task.id}" />
          <button type="submit">Remove</button>
        </form>
      </li>
    `).join("")

		const html = `
      <h1>Hello Pasta</h1>
      <div>Build: ${Bun.env.PASTA_BUILD}</div>
      <div>Branch: ${Bun.env.PASTA_BRANCH}</div>
      <hr />
      <h3>Add Task</h3>
      <form method="POST" action="/add-task">
        <input type="text" name="name" required />
        <button type="submit">Add</button>
      </form>
      <h2>Tasks</h2>
      <ul>${taskList}</ul>
    `
		return new Response(html, { headers: { "Content-Type": "text/html" } })
	}

	if (url.pathname === "/add-task" && request.method === "POST") {
		const formData = await request.formData()
		const newTask = { id: crypto.randomUUID(), name: formData.get("name") }
		const tasks = getTasks()
		tasks.push(newTask)
		saveTasks(tasks)
		return Response.redirect("/")
	}

	if (url.pathname === "/delete-task" && request.method === "POST") {
		const formData = await request.formData()
		const id = formData.get("id")
		const tasks = getTasks()
		const index = tasks.findIndex(task => task.id === id)
		if (index !== -1) {
			tasks.splice(index, 1)
			saveTasks(tasks)
		}
		return Response.redirect("/")
	}

	return new Response("Not Found", { status: 404 })
}

function getTasks() {
	if (!existsSync(tasksFilePath))
		return []
	const data = readFileSync(tasksFilePath, "utf8")
	return JSON.parse(data)
}

function saveTasks(tasks) {
	writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2))
}

export default { port, fetch }
