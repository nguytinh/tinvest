import { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import { useNavigate } from 'react-router-dom'

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  isFavorite?: boolean
}

interface BallViewProps {
  stocks: Stock[]
}

const BallView = ({ stocks }: BallViewProps) => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!sceneRef.current || stocks.length === 0) return

    // Cleanup existing instance
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false)
      Matter.Engine.clear(engineRef.current)
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current)
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove()
        }
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current)
      }
    }

    // Setup Matter JS
    const Engine = Matter.Engine
    const Render = Matter.Render
    const World = Matter.World
    const Bodies = Matter.Bodies
    const Mouse = Matter.Mouse
    const MouseConstraint = Matter.MouseConstraint
    const Runner = Matter.Runner
    const Composite = Matter.Composite
    const Events = Matter.Events

    const engine = Engine.create()
    engineRef.current = engine

    const width = sceneRef.current.clientWidth
    const height = sceneRef.current.clientHeight

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
      }
    })
    renderRef.current = render

    // Create bounds
    const wallOptions = { 
      isStatic: true, 
      render: { 
        fillStyle: '#333',
        visible: true
      } 
    }
    
    const ground = Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions)
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, wallOptions)
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions)

    World.add(engine.world, [ground, leftWall, rightWall])

    // Create stock balls
    const stockBodies = stocks.map((stock) => {
      // Calculate radius based on change percent
      // Min radius 30, Max radius 80
      const absChange = Math.abs(stock.changePercent)
      const radius = Math.min(Math.max(30 + absChange * 5, 30), 80)
      
      const x = Math.random() * (width - 100) + 50
      const y = -Math.random() * 500 - 50 // Start above the screen

      const color = stock.change >= 0 
        ? '#22c55e' // Green
        : '#ef4444' // Red

      const body = Bodies.circle(x, y, radius, {
        restitution: 0.5, // Bounciness
        friction: 0.001,
        frictionAir: 0.02, // Air resistance
        render: {
          visible: false // Hide default rendering to draw custom 3D sphere
        },
        label: stock.symbol
      })

      // Attach stock data to body for retrieval
      ;(body as any).stockData = stock
      
      return body
    })

    World.add(engine.world, stockBodies)

    // Add mouse control
    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    })

    World.add(engine.world, mouseConstraint)

    // Keep the mouse in sync with rendering
    render.mouse = mouse

    // Handle clicks
    Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePosition = event.mouse.position
      const clickedBodies = Matter.Query.point(stockBodies, mousePosition)
      
      if (clickedBodies.length > 0) {
        const body = clickedBodies[0]
        // Check if it was a quick click (not a drag) - handled by simple navigation for now
        // Enhancing this to be a double click or long press might be better, 
        // but for now let's navigate on click if not dragging significantly? 
        // Actually standard matter.js mouse constraint handles drag. 
        // We might want to navigate on double click to avoid conflict with dragging.
      }
    })
    
    // Custom rendering for text and 3D spheres
    Events.on(render, 'afterRender', () => {
      const context = render.context
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      stockBodies.forEach((body) => {
        const { x, y } = body.position
        // @ts-ignore
        const radius = body.circleRadius
        const stock = (body as any).stockData as Stock
        
        // Draw 3D Sphere
        const gradient = context.createRadialGradient(
          x - radius * 0.3, y - radius * 0.3, radius * 0.1, // Light source offset
          x, y, radius // Outer edge
        )
        
        if (stock.change >= 0) {
          // Green gradient
          gradient.addColorStop(0, '#4ade80') // lighter green highlight
          gradient.addColorStop(0.5, '#22c55e') // base green
          gradient.addColorStop(1, '#14532d') // darker green shadow
        } else {
          // Red gradient
          gradient.addColorStop(0, '#f87171') // lighter red highlight
          gradient.addColorStop(0.5, '#ef4444') // base red
          gradient.addColorStop(1, '#7f1d1d') // darker red shadow
        }

        context.beginPath()
        context.arc(x, y, radius, 0, 2 * Math.PI)
        context.fillStyle = gradient
        
        // Add drop shadow for depth
        context.shadowColor = 'rgba(0, 0, 0, 0.4)'
        context.shadowBlur = 8
        context.shadowOffsetX = 2
        context.shadowOffsetY = 4
        
        context.fill()
        
        // Reset shadow for text
        context.shadowColor = 'transparent'
        context.shadowBlur = 0
        context.shadowOffsetX = 0
        context.shadowOffsetY = 0

        // Draw Symbol
        context.fillStyle = '#ffffff'
        context.font = `bold ${Math.max(12, radius * 0.35)}px Inter, sans-serif`
        context.fillText(stock.symbol, x, y - radius * 0.15)
        
        // Draw % Change
        context.font = `${Math.max(10, radius * 0.25)}px Inter, sans-serif`
        context.fillText(`${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`, x, y + radius * 0.15)
      })
    })

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current || !renderRef.current) return
      
      const newWidth = sceneRef.current.clientWidth
      const newHeight = window.innerHeight - 200

      renderRef.current.canvas.width = newWidth
      renderRef.current.canvas.height = newHeight
      renderRef.current.options.width = newWidth
      renderRef.current.options.height = newHeight
      
      // Reposition walls
      Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 25 })
      Matter.Body.setPosition(rightWall, { x: newWidth + 25, y: newHeight / 2 })
      Matter.Body.setPosition(leftWall, { x: -25, y: newHeight / 2 })
      
      // Scale rectangle bodies if needed (walls need to be wider/taller)
      // Actually just simpler to remove and re-add walls or set vertices, 
      // but setPosition covers the main 'container' aspect.
    }

    window.addEventListener('resize', handleResize)

    // Run the engine
    Runner.run(engine)
    Render.run(render)
    
    runnerRef.current = Runner.create()
    Runner.run(runnerRef.current, engine)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (runnerRef.current) Runner.stop(runnerRef.current)
      if (renderRef.current) {
        Render.stop(renderRef.current)
        if (renderRef.current.canvas) renderRef.current.canvas.remove()
      }
      if (engineRef.current) Matter.Engine.clear(engineRef.current)
    }
  }, [stocks])

  // Double click handler for navigation (since single click is often used for dragging)
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!engineRef.current) return
    
    // Find body at click position
    const rect = sceneRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const bodies = Matter.Composite.allBodies(engineRef.current.world)
    const clickedBodies = Matter.Query.point(bodies, { x, y })
    
    const stockBody = clickedBodies.find(b => (b as any).stockData)
    
    if (stockBody) {
      const stock = (stockBody as any).stockData as Stock
      navigate(`/stock/${stock.symbol}`)
    }
  }

  return (
    <div 
      className="ball-view-container" 
      ref={sceneRef} 
      onDoubleClick={handleDoubleClick}
      title="Double click a ball to view details, drag to play"
    />
  )
}

export default BallView

