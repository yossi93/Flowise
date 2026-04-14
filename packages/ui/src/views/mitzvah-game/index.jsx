import { useEffect, useRef, useState } from 'react'

// material-ui
import { Box, Button, Chip, Stack, Typography } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const GRAVITY = 0.6
const JUMP_FORCE = 12
const MOVE_SPEED = 4
const MAX_MITZVOS = 8

const groundY = CANVAS_HEIGHT - 70

const createPlatforms = () => [
    { x: 0, y: groundY, width: CANVAS_WIDTH, height: 70 },
    { x: 80, y: groundY - 110, width: 200, height: 12 },
    { x: 340, y: groundY - 180, width: 140, height: 12 },
    { x: 540, y: groundY - 140, width: 180, height: 12 },
    { x: 780, y: groundY - 220, width: 140, height: 12 }
]

const createPlayer = () => ({
    x: 60,
    y: groundY - 48,
    width: 42,
    height: 48,
    dx: 0,
    dy: 0,
    facing: 1,
    onGround: false
})

const generateMitzvah = () => {
    const platform = createPlatforms()[Math.floor(Math.random() * (createPlatforms().length - 1)) + 1]
    return {
        x: platform.x + 20 + Math.random() * (platform.width - 40),
        y: platform.y - 14,
        radius: 12,
        collected: false
    }
}

const drawPlatform = (ctx, platform) => {
    ctx.fillStyle = '#2d3b55'
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    ctx.fillStyle = '#3f5179'
    ctx.fillRect(platform.x, platform.y + platform.height - 4, platform.width, 4)
}

const drawPlayer = (ctx, player) => {
    ctx.fillStyle = '#d9514e'
    ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.fillStyle = '#f5d547'
    ctx.fillRect(player.x + 10, player.y + 12, 12, 12)
    ctx.fillStyle = '#f1ede1'
    ctx.fillRect(player.x + 14, player.y + 28, 6, 12)
    ctx.fillStyle = '#2d3b55'
    ctx.fillRect(player.x + (player.facing === 1 ? 24 : 8), player.y + 8, 8, 8)
}

const drawMitzvah = (ctx, mitzvah) => {
    ctx.beginPath()
    ctx.arc(mitzvah.x, mitzvah.y, mitzvah.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#ffd166'
    ctx.fill()
    ctx.strokeStyle = '#f79c42'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.closePath()
    ctx.fillStyle = '#2d3b55'
    ctx.font = 'bold 12px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('✡', mitzvah.x, mitzvah.y + 4)
}

const drawBackdrop = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#1c2541')
    gradient.addColorStop(1, '#0b132b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = '#0e1938'
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * CANVAS_WIDTH
        const y = Math.random() * (CANVAS_HEIGHT / 2)
        ctx.fillRect(x, y, 2, 2)
    }
}

const MitzvahGame = () => {
    const canvasRef = useRef(null)
    const requestRef = useRef(null)
    const keysRef = useRef({ left: false, right: false, jump: false })
    const playerRef = useRef(createPlayer())
    const mitzvosRef = useRef(Array.from({ length: 4 }, generateMitzvah))
    const platformsRef = useRef(createPlatforms())
    const spawnTimerRef = useRef(0)
    const scoreRef = useRef(0)

    const [score, setScore] = useState(0)
    const [status, setStatus] = useState('running')
    const [floatingText, setFloatingText] = useState('Collect mitzvos while staying on the platforms!')

    useEffect(() => {
        scoreRef.current = score
    }, [score])

    const resetGame = () => {
        playerRef.current = createPlayer()
        platformsRef.current = createPlatforms()
        mitzvosRef.current = Array.from({ length: 4 }, generateMitzvah)
        spawnTimerRef.current = 0
        setScore(0)
        setStatus('running')
        setFloatingText('Collect mitzvos while staying on the platforms!')
    }

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = true
            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = true
            if (event.key === ' ' || event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keysRef.current.jump = true
        }

        const handleKeyUp = (event) => {
            if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = false
            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = false
            if (event.key === ' ' || event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keysRef.current.jump = false
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let lastTime = 0

        const update = (time) => {
            const delta = time - lastTime
            lastTime = time
            spawnTimerRef.current += delta

            if (status === 'paused') {
                drawBackdrop(ctx)
                platformsRef.current.forEach((platform) => drawPlatform(ctx, platform))
                mitzvosRef.current.forEach((mitzvah) => drawMitzvah(ctx, mitzvah))
                drawPlayer(ctx, playerRef.current)
                ctx.fillStyle = 'rgba(12, 18, 38, 0.6)'
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
                ctx.fillStyle = '#f1ede1'
                ctx.font = 'bold 28px Inter'
                ctx.textAlign = 'center'
                ctx.fillText('Paused - take a breather', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
                requestRef.current = requestAnimationFrame(update)
                return
            }

            const player = playerRef.current
            const mitzvos = mitzvosRef.current

            // backdrop & platforms
            drawBackdrop(ctx)
            platformsRef.current.forEach((platform) => drawPlatform(ctx, platform))

            // player movement
            player.dx = 0
            if (keysRef.current.left) {
                player.dx = -MOVE_SPEED
                player.facing = -1
            }
            if (keysRef.current.right) {
                player.dx = MOVE_SPEED
                player.facing = 1
            }

            player.dy += GRAVITY

            let onGround = false
            const nextX = player.x + player.dx
            const nextY = player.y + player.dy

            platformsRef.current.forEach((platform) => {
                const collisionX = nextX < platform.x + platform.width && nextX + player.width > platform.x
                const collisionY = nextY < platform.y + platform.height && nextY + player.height > platform.y

                if (collisionX && collisionY) {
                    // landing on a platform
                    if (player.y + player.height <= platform.y + 6 && player.dy >= 0) {
                        player.dy = 0
                        player.y = platform.y - player.height
                        onGround = true
                    }
                }
            })

            if (onGround && keysRef.current.jump) {
                player.dy = -JUMP_FORCE
                setFloatingText('Nice jump! Keep collecting mitzvos!')
            }

            player.y += player.dy
            player.x += player.dx

            if (player.y + player.height > CANVAS_HEIGHT) {
                setStatus('paused')
                setFloatingText('You fell! Reset to try again.')
            }

            if (player.x + player.width < 0) player.x = CANVAS_WIDTH - player.width
            if (player.x > CANVAS_WIDTH) player.x = 0

            // mitzvah collection
            mitzvos.forEach((mitzvah) => {
                if (mitzvah.collected) return
                const dx = player.x + player.width / 2 - mitzvah.x
                const dy = player.y + player.height / 2 - mitzvah.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance < mitzvah.radius + player.width / 2) {
                    mitzvah.collected = true
                    setScore((prev) => prev + 1)
                    setFloatingText('Mitzvah collected! Keep going!')
                }
            })

            mitzvosRef.current = mitzvos.filter((mitzvah) => !mitzvah.collected)

            if (mitzvosRef.current.length < MAX_MITZVOS && spawnTimerRef.current > 1200) {
                mitzvosRef.current = [...mitzvosRef.current, generateMitzvah()]
                spawnTimerRef.current = 0
            }

            mitzvosRef.current.forEach((mitzvah) => drawMitzvah(ctx, mitzvah))
            drawPlayer(ctx, player)

            ctx.fillStyle = '#f1ede1'
            ctx.font = 'bold 16px Inter'
            ctx.textAlign = 'left'
            ctx.fillText('Mitzvos: ' + scoreRef.current, 16, 30)

            requestRef.current = requestAnimationFrame(update)
        }

        requestRef.current = requestAnimationFrame(update)

        return () => {
            cancelAnimationFrame(requestRef.current)
        }
    }, [status])

    return (
        <MainCard title='Mitzvah Run (offline mini-game)' contentSX={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography>
                    A lightweight, Mario-inspired platformer you can play offline. Collect as many mitzvah stars as you can while
                    staying on the platforms. Use the arrow keys (or A/D) to run and space/arrow up to jump.
                </Typography>
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Chip label={`Mitzvos collected: ${score}`} color='warning' sx={{ fontWeight: 600 }} />
                    <Chip label={status === 'paused' ? 'Paused' : 'Running'} color={status === 'paused' ? 'default' : 'success'} />
                    <Typography variant='body2' color='secondary'>
                        {floatingText}
                    </Typography>
                </Stack>
                <Box
                    sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: (theme) => `0 0 0 1px ${theme.palette.divider}`
                    }}
                >
                    <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: '100%', display: 'block' }} />
                </Box>
                <Stack direction='row' spacing={1}>
                    <Button variant='contained' color='primary' onClick={() => setStatus((prev) => (prev === 'running' ? 'paused' : 'running'))}>
                        {status === 'running' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button variant='outlined' color='secondary' onClick={resetGame}>
                        Reset &amp; Restart
                    </Button>
                </Stack>
            </Stack>
        </MainCard>
    )
}

export default MitzvahGame
