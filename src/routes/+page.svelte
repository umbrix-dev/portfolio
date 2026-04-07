<script>
  let dark = $state(false);
  let copied = $state(false);

  const projects = [
    {
        id: 1,
        title: "Gliding System",
        description: "An Elytra-inspired gliding system for Roblox that uses physics forces to counter gravity and propel players forward, fully configurable.",
        scripts: [
            {
                name: "GlidingManager.luau",
                content: `local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ContextActionService = game:GetService("ContextActionService")

local Config = require(script.Config)
local Utility = require(script.Utility)
local AnimationManager = require(script.Parent.AnimationManager)

local Glider = script.Parent.Parent.Assets.Glider

local GliderManager = {}
GliderManager.__index = GliderManager

local Camera: Camera? = workspace.CurrentCamera
local Player: Player? = nil
local Character: Model? = nil
local Humanoid: Humanoid? = nil
local HumanoidRootPart: BasePart? = nil

local debounce = false
local isGliding = false
local currentFallSpeed = Config.DefaultFallSpeed
local currentForwardSpeed = Config.DefaultForwardSpeed

function GliderManager.startGlide()
	if isGliding then
		return
	else
		isGliding = true
	end

	AnimationManager:Play("Gliding", false, Config.AnimationTransitionTime)
end

function GliderManager.stopGlide()
	isGliding = false

	-- If on ground fully reset force speeds, when still in air
	-- half the current force speeds to dampen it progressively
	if Humanoid.FloorMaterial ~= Enum.Material.Air then
		currentFallSpeed = Config.DefaultFallSpeed
		currentForwardSpeed = Config.DefaultForwardSpeed
	else
		currentFallSpeed = math.max(Config.DefaultFallSpeed, currentFallSpeed / 2)
		currentForwardSpeed = math.max(Config.DefaultForwardSpeed, currentForwardSpeed / 2)
	end

	AnimationManager:Stop("Gliding")
end

function GliderManager.applyForce(deltaTime: number)
	currentFallSpeed = math.min(currentFallSpeed + Config.FallAcceleration * deltaTime, Config.MaximumFallSpeed)
	currentForwardSpeed = math.min(currentForwardSpeed + Config.ForwardAcceleration * deltaTime, Config.MaximumForwardSpeed)

	local velocity = HumanoidRootPart.AssemblyLinearVelocity
	local clampedY = math.max(velocity.Y, -currentFallSpeed)
	local lookFlat = Vector3.new(HumanoidRootPart.CFrame.LookVector.X, 0, HumanoidRootPart.CFrame.LookVector.Z).Unit
	local forward = lookFlat * currentForwardSpeed

	HumanoidRootPart.AssemblyLinearVelocity = Vector3.new(forward.X, clampedY, forward.Z)
end

function GliderManager.update(deltaTime: number)
	if not isGliding then
		return
	end

	GliderManager.applyForce(deltaTime)
end

function GliderManager.action(_, inputState: Enum.UserInputState)
	if inputState == Enum.UserInputState.Begin then				
		if Humanoid.FloorMaterial == Enum.Material.Air then	
			if debounce then
				return
			else
				debounce = true
			end

			GliderManager.startGlide()

			task.delay(Config.Cooldown, function()
				debounce = false
			end)
		else
			-- Since we override the [ SPACE ] key with this action
			-- we also need to handle jumping manually here
			Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
		end
	elseif inputState == Enum.UserInputState.End then
		GliderManager.stopGlide()
	end
end

function GliderManager.setup(player: Player)
	if player.Character then
		GliderManager.main(player.Character)
	end
	
	player.CharacterAdded:Connect(GliderManager.main)
	player.CharacterRemoving:Connect(function()
		Character = nil
		Humanoid = nil
		HumanoidRootPart = nil
	end)
	
	GliderManager.handleAllPlayers()
end

-- This function currently only works on the R15 RIG
function GliderManager.handleAttachment(character: Model)
	local upperTorso = character:WaitForChild("UpperTorso")
	local bodyBackAttachment: Attachment = upperTorso:WaitForChild("BodyBackAttachment")
	
	local glider = Glider:Clone()
	glider.Parent = character

	local offset = CFrame.new(0.65, 0, 0)
	local angles = CFrame.Angles(0, math.rad(-180), math.rad(165))

	local motor = Instance.new("Motor6D")
	motor.Part0 = upperTorso
	motor.Part1 = glider.PrimaryPart
	motor.C0 = bodyBackAttachment.CFrame * offset * angles
	motor.Parent = upperTorso
end

function GliderManager.handleAllPlayers()
	for _, player in Players:GetPlayers() do
		if player.Character then
			GliderManager.handleAttachment(player.Character)
		end
		player.CharacterAdded:Connect(GliderManager.handleAttachment)
	end

	Players.PlayerAdded:Connect(function(player)
		player.CharacterAdded:Connect(GliderManager.handleAttachment)
	end)
end

function GliderManager.main(character: Model)
	Character = character
	Humanoid = character:WaitForChild("Humanoid")
	HumanoidRootPart = character:WaitForChild("HumanoidRootPart")
	
	Humanoid:GetPropertyChangedSignal("FloorMaterial"):Connect(function()
		if not Utility.inAir(Humanoid) then
			GliderManager.stopGlide()
		end
	end)
	
	RunService.RenderStepped:Connect(GliderManager.update)
	
	ContextActionService:BindAction(
		"GliderManager",
		GliderManager.action,
		false,
		table.unpack(Config.Keybinds)
	)
	
	local mobileJumpButton = Utility.getMobileJumpButton(Player)
	if not mobileJumpButton then
		return
	end
	
	mobileJumpButton.InputBegan:Connect(function()
		GliderManager.action(nil, Enum.UserInputState.Begin)
	end)
	
	mobileJumpButton.InputEnded:Connect(function()
		GliderManager.action(nil, Enum.UserInputState.End)
	end)
end

return GliderManager`
            },
        ]
    },
    {
        id: 2,
        title: "Round Manager",
        description: "A modular round manager seperated into logic, flow, and handling.",
        scripts: [
            {
                name: "RoundManager.luau",
                content: `local Config = require(script.Config)
if game:GetService("RunService"):IsStudio() then
	for key, value in require(script.DebugConfig) do
		Config[key] = value
	end
end

local RoundLogic = require(script.RoundLogic)
local PlayerHandler = require(script.PlayerHandler)
local RoundFlow = require(script.RoundFlow)

local Players = game:GetService("Players")
local RoundManager = {}

local hunterSpawnPosition
local runnersSpawnPosition
local setupDone = false

function RoundManager.setup(hunterSpawnPos: Vector3, runnersSpawnPos: Vector3)
	hunterSpawnPosition = hunterSpawnPos
	runnersSpawnPosition = runnersSpawnPos
	setupDone = true
end

function RoundManager.startRound()
	if not setupDone then
		warn("[RoundManager]:", "Execute 'RoundManager.setup' first, before running any other function")
	end
	
	RoundFlow.startRound(
		RoundLogic,
		PlayerHandler,
		Players:GetPlayers(),
		Config.MinimumRequiredPlayers,
		hunterSpawnPosition,
		runnersSpawnPosition,
		Config.HunterFreezeDuration,
		Config.RoundDuration
	)
end

return RoundManager`
            },
                        {
                name: "RoundLogic.luau",
                content: `local Teams = game:GetService("Teams")
local Players = game:GetService("Players")
local RoundLogic = {}

function RoundLogic.validatePlayers(minimumRequiredPlayers: number): boolean
	if #Players:GetPlayers() < minimumRequiredPlayers then
		return false
	else
		return true
	end
end

function RoundLogic.allRunnersDead(): boolean
	local result = true

	local runners = Teams.Runners:GetPlayers()
	if #runners == 0 then
		return false
	end

	for _, runner in pairs(runners) do
		local character = runner.Character
		if not character then
			continue
		end

		local humanoid: Humanoid? = character:FindFirstChild("Humanoid")
		if humanoid and humanoid.Health > 0 then
			result = false
			break
		end
	end

	return result
end

return RoundLogic`
            },
            {
                name: "RoundFlow.luau",
                content: `local Types = require(script.Parent.Types)

local Teams = game:GetService("Teams")
local RoundFlow = {}

local roundActive = false

function RoundFlow.endRound(winner: Teams)
	roundActive = false

	print("[RoundManager]:", "The winner team is:", winner.Name)
end

function RoundFlow.cancelRound(message: string)
	roundActive = false

	print("[RoundManager]:", "Round canceled:", message)
end

function RoundFlow.runRound(roundLogic: Types.RoundLogic, roundDuration: number)
	local timer = roundDuration

	task.spawn(function()
		while roundActive do
			if timer <= 0 then
				print("[RoundManager]:", "Timer has ended, end round")
				RoundFlow.endRound(Teams.Runners)
				break
			end

			if roundLogic.allRunnersDead() then
				RoundFlow.endRound(Teams.Hunter)
				break
			end

			-- Hunter left
			if not Teams.Hunter:GetPlayers()[1] then
				RoundFlow.cancelRound("Hunter has left")
				break
			end 

			-- All runners left
			if #Teams.Runners:GetPlayers() <= 0 then
				RoundFlow.cancelRound("All runners have left")
				break
			end

			task.wait(1)
			timer -= 1
		end
	end)
end

function RoundFlow.startRound(
	roundLogic: Types.RoundLogic, 
	playerHandler: Types.PlayerHandler,
	players: { Player },
	minimumRequiredPlayers: number,
	hunterSpawnPosition: Vector3,
	runnersSpawnPosition: Vector3,
	hunterFreezeDuration: number,
	roundDuration: number
)
	print("hunter freeze duration:", hunterFreezeDuration)
	
	if not roundLogic.validatePlayers(minimumRequiredPlayers) then
		warn("[RoundManager]:", "Not enough to players to start the round")
		return
	end

	if roundActive then
		warn("[RoundManager]:", "Can't start round because its already active")
		return
	else
		roundActive = true
	end

	print("[RoundManager]:", "Round has started")

	playerHandler.setupTeams(players, hunterSpawnPosition, runnersSpawnPosition, hunterFreezeDuration)
	RoundFlow.runRound(roundLogic, roundDuration)
end

return RoundFlow`
            },
            {
                name: "PlayerHandler.luau",
                content: `local Teams = game:GetService("Teams")
local PlayerHandler = {}

local function spawnBase(player: Player, position: Vector3)
	local character = player.Character
	if not character then
		return
	end

	local targetPosition = CFrame.new(position) 
		+ Vector3.new(0, character:GetPivot().Position.Y / 2, 0)

	character:PivotTo(targetPosition)
end

-- Maybe disable player controls instead of anchoring
-- cause this will also currently freeze the pose, this could be fixed
-- stopping all currently running animations tracks but another issue
-- is that it doesn't stop movement sounds
local function setPlayerAnchored(player: Player, value: boolean)
	local character = player.Character
	if not character then
		return
	end

	for _, descendant in pairs(character:GetDescendants()) do
		local isAnchorable, _ = pcall(function()
			descendant["Anchored"] = descendant["Anchored"]
		end)	

		if not isAnchorable then
			continue
		end

		descendant.Anchored = value
	end
end

function PlayerHandler.setupTeams(
	players: { Player },
	hunterSpawnPosition: Vector3,
	runnersSpawnPosition: Vector3,
	hunterFreezeDuration: number
)
	local randomPlayer = players[math.random(1, #players)]
	if not randomPlayer then
		return
	end

	for _, player in pairs(players) do
		if player ~= randomPlayer then
			player.Team = Teams.Runners
			spawnBase(player, runnersSpawnPosition)
		else
			player.Team = Teams.Hunter
			spawnBase(player, hunterSpawnPosition)

			-- Wait a heartbeat to let the teleport replicate first
			task.wait()

			setPlayerAnchored(player, true)
			task.delay(hunterFreezeDuration, function()
				setPlayerAnchored(player, false)
			end)
		end
	end
end

return PlayerHandler`
            }
        ]
    },
    {
        id: 3,
        title: "Profile Manager",
        description: "A robust ProfileStore wrapper that automatically seperates development and production data scopes, ensuring safe testing without risking live player data. Includes session management, GDPR compilance, and streamlined access for reliable, scalable player data handling.",
        scripts: [
            {
                name: "ProfileManager.luau",
                content: `local ProfileStore = require(script.Parent.Parent.Packages.ProfileStore)
local ProfileTemplate = require(script.ProfileTemplate)

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local ProfileManager = {}

local scope
if RunService:IsStudio() then
	scope = "Development"
else
	scope = "Production"
end

local PlayerStore = ProfileStore.New("PlayerStore@" .. scope, ProfileTemplate)
local Profiles = {}

function ProfileManager.onPlayerAdded(player: Player)
	local profile = PlayerStore:StartSessionAsync(tostring(player.UserId), {
		Cancel = function()
			return player.Parent ~= Players
		end
	})
	
	if profile == nil then
		player:Kick("Failed to load data. Rejoin.")
		return
	end
	
	--[[
		Required for GDPR compilance. Do NOT remove.
		Ensures player data can be properly deleted if requested.
		https://create.roblox.com/docs/production/publishing/about-GDPR-and-CCPA
	--]]
	profile:AddUserId(player.UserId)
	
	profile:Reconcile()
	
	profile.OnSessionEnd:Connect(function()
		Profiles[player] = nil
		player:Kick("Your session has ended. Rejoin.")
	end)
	
	if player.Parent ~= Players then
		profile:EndSession()
	end
	
	Profiles[player] = profile
	print("Profile loaded for:", player.Name .. "!")
end

function ProfileManager.onPlayerRemoving(player: Player)
	local profile = Profiles[player]
	if profile ~= nil then
		profile:EndSession()
	end
end

function ProfileManager.handleExisting()	
	for _, player in Players:GetPlayers() do
		task.spawn(ProfileManager.onPlayerAdded, player)
	end
end

function ProfileManager.getPlayerData(player: Player, key: string): any
	return Profiles[player].Data[key]
end

function ProfileManager.setPlayerData(player: Player, key: string, value: any)
	Profiles[player].Data[key] = value
end

return ProfileManager`
            }
        ]
    },
    {
        id: 4,
        title: "Lobby Manager",
        description: "A simple lobby manager that perfectly compliments the Round Manager",
        scripts: [
            {
                name: "LobbyManager.luau",
                content: `local PacketModule = script.Parent.Parent.Packages.Packet
local Packet = require(PacketModule)
local PacketFireAllClients = require(PacketModule.FireAllClients)
local updateLobbyTimerPacket = Packet("UpdateLobbyTimer", {
	mode = Packet.String,
	value = Packet.Any,
	lifetime = Packet.NumberS8
})

local Players = game:GetService("Players")
local LobbyManager = {}

local WAIT_DURATION = 30
local MINIMUM_REQUIRED_PLAYERS = 2

local isActive = false

local function validatePlayers(): boolean
	return #Players:GetPlayers() >= MINIMUM_REQUIRED_PLAYERS
end

local function fireWaiting()
	PacketFireAllClients(updateLobbyTimerPacket, {
		mode = "message",
		value = "Waiting for players...",
		lifetime = -1
	})
end

local function fireTimer(i: number)
	PacketFireAllClients(updateLobbyTimerPacket, {
		mode = "timer",
		value = "Starting round in: " .. tostring(i),
		lifetime = -1
	})
end

function LobbyManager.startTimer(onDone: () -> ())
	if isActive then return end
	isActive = true

	print("[LobbyManager]: Lobby loop started")

	while true do
		while not validatePlayers() do
			fireWaiting()
			task.wait(1)
		end

		local cancelled = false
		for i = WAIT_DURATION, 0, -1 do
			if not validatePlayers() then
				cancelled = true
				break
			end
			fireTimer(i)
			task.wait(1)
		end

		if not cancelled then
			break
		end

		print("[LobbyManager]: Player count dropped, resetting timer")
	end

	print("[LobbyManager]: Timer finished, starting round")
	isActive = false
	onDone()
end

return LobbyManager`
            }
        ]
    },
    {
        id: 5,
        title: "Background Generator",
        description: "A very customizable and extended background generator.",
        scripts: [
            {
                name: "BackgroundGenerator.luau",
                content: `--!strict

local Types = require(script.Types)
local Defaults = require(script.Defaults)
local BackgroundBuilder = require(script.BackgroundBuilder)
local TileBuilder = require(script.TileBuilder)

local BackgroundGenerator = {}
BackgroundGenerator.__index = BackgroundGenerator

export type ShapeTypes = Types.ShapeTypes
export type LayerConfig = Types.LayerConfig

BackgroundGenerator.ShapeTypes = Types.ShapeTypes
BackgroundGenerator.Default = Defaults.Config

local Default = Defaults.Config

--[[
Create a new Background Generator.
All parameters but the parent are optional and will
fallback to default if not set.

You can use either the single-layer approach (passing tile properties directly)
or you can set the properties on the object itself later on
or the multi-layer approach (passing a layers table for multiple grid layers).
]]
function BackgroundGenerator.new(
	---// required
	parent				: Instance,
	---// layers (for multiple grid layers - use this OR the single-layer properties below)
	layers				: {LayerConfig}?,
	---// grid (single-layer mode)
	gridOffsetX			: number?,
	gridOffsetY			: number?,
	---// tile (single-layer mode)
	tiles				: boolean?,
	tileShape			: ShapeTypes?,
	tileRows 			: number?,
	tileColumns 		: number?,
	tileRotation 		: number?,
	tileSize			: number?,
	tileThickness		: number?,
	tileCircleSize		: number?,
	---// colors
	backgroundColor		: Color3?,
	backgroundGradient	: {a : Color3, b : Color3, rotation : number}?,
	backgroundOpacity	: number?,
	foregroundColor		: Color3?,
	foregroundGradient	: {a : Color3, b : Color3, rotation : number}?,
	foregroundOpacity	: number?,
	---// misc
	performanceMode		: boolean?
)
	local self = setmetatable({}, BackgroundGenerator)

	-- Required
	self.parent = parent

	-- Multi-layer mode
	self.layers = layers

	-- Single-layer mode (for backward compatibility)
	self.gridOffsetX = gridOffsetX or Default.gridOffsetX
	self.gridOffsetY = gridOffsetY or Default.gridOffsetY
	self.tiles = tiles or Default.tiles
	self.tileShape = tileShape or Default.tileShape
	self.tileRows = tileRows or Default.tileRows
	self.tileColumns = tileColumns or Default.tileColumns
	self.tileSize = tileSize or Default.tileSize
	self.tileRotation = tileRotation or Default.tileRotation
	self.tileThickness = tileThickness or Default.tileThickness
	self.tileCircleSize = tileCircleSize or Default.tileCircleSize

	if self.tileSize < Default.minimumTileSize then
		self.tileSize = Default.minimumTileSize
	end

	-- Colors
	self.backgroundColor = backgroundColor or Default.backgroundColor
	self.backgroundGradient = backgroundGradient or nil
	self.backgroundOpacity = backgroundOpacity or Default.backgroundOpacity
	self.foregroundColor = foregroundColor or Default.foregroundColor
	self.foregroundGradient = foregroundGradient or nil
	self.foregroundOpacity = foregroundOpacity or Default.foregroundOpacity

	-- Misc
	self.performanceMode = performanceMode or Default.performanceMode

	return self
end

-- Generate your Background.
function BackgroundGenerator:generate()
	local background = BackgroundBuilder.create(self.parent, self)

	-- Multi-layer mode
	if self.layers then
		for _, layerConfig in ipairs(self.layers) do
			if layerConfig.layer then
				local layerDefaults = BackgroundGenerator._mergeLayerDefaults(layerConfig, self.performanceMode)
				TileBuilder.generateTiles(background, layerDefaults, layerConfig.layer)
			else
				warn("BackgroundGenerator: Layer config missing 'layer' property. Skipping layer.")
			end
		end
		-- Single-layer mode (backward compatibility)
	elseif self.tiles then
		TileBuilder.generateTiles(background, self)
	end
end

-- Merges layer config with defaults
function BackgroundGenerator._mergeLayerDefaults(layerConfig: LayerConfig, performanceMode: boolean): any
	return {
		tileShape = layerConfig.tileShape or Default.tileShape,
		tileSize = layerConfig.tileSize or Default.tileSize,
		tileRotation = layerConfig.tileRotation or Default.tileRotation,
		tileThickness = layerConfig.tileThickness or Default.tileThickness,
		tileCircleSize = layerConfig.tileCircleSize or Default.tileCircleSize,
		foregroundColor = layerConfig.foregroundColor or Default.foregroundColor,
		foregroundGradient = layerConfig.foregroundGradient or nil,
		foregroundOpacity = layerConfig.foregroundOpacity or Default.foregroundOpacity,
		gridOffsetX = layerConfig.gridOffsetX or Default.gridOffsetX,
		gridOffsetY = layerConfig.gridOffsetY or Default.gridOffsetY,
		tileRows = layerConfig.tileRows or Default.tileRows,
		tileColumns = layerConfig.tileColumns or Default.tileColumns,
		performanceMode = performanceMode,
	}
end

return BackgroundGenerator`
            },
            {
                name: "BackgroundBuilder.luau",
                content: `--!strict

local BackgroundBuilder = {}

-- Creates and configures the main background frame
function BackgroundBuilder.create(parent: Instance, config: any): Frame
	local background = Instance.new("Frame")
	background.Parent = parent
	background.Name = "Background"
	background.ZIndex = 0
	background.Size = UDim2.fromScale(1, 1)
	background.BackgroundTransparency = config.backgroundOpacity

	BackgroundBuilder._applyBackgroundColor(background, config)

	return background
end

function BackgroundBuilder._applyBackgroundColor(background: Frame, config: any): ()
	if config.backgroundGradient then
		BackgroundBuilder.applyGradient(background, config.backgroundGradient)
	else
		background.BackgroundColor3 = config.backgroundColor
	end
end

-- Applies a gradient to a Frame or UIStroke instance
function BackgroundBuilder.applyGradient(instance: Instance, gradient: {a: Color3, b: Color3, rotation: number}): ()
	local colorA = gradient[1]
	local colorB = gradient[2]
	local rotation = gradient[3]

	local uiGradient = Instance.new("UIGradient")
	uiGradient.Parent = instance
	uiGradient.Rotation = rotation
	uiGradient.Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, colorA),
		ColorSequenceKeypoint.new(1, colorB)
	})

	if instance:IsA("Frame") then
		instance.BackgroundColor3 = Color3.new(1, 1, 1)
	elseif instance:IsA("UIStroke") then
		instance.Color = Color3.new(1, 1, 1)
	end
end

return BackgroundBuilder`
            },
            {
                name: "TileBuilder.luau",
                content: `--!strict
--!optimize 1

local Types = require(script.Parent.Types)
local BackgroundBuilder = require(script.Parent.BackgroundBuilder)

local TileBuilder = {}

-- Creates a single tile with the specified shape and styling
function TileBuilder.createTile(parent: Frame, config: any, layer: number?): Frame
	local tile = Instance.new("Frame")
	tile.Parent = parent
	tile.ZIndex = layer or 1
	tile.Size = UDim2.fromOffset(config.tileSize, config.tileSize)
	tile.BackgroundTransparency = 1
	tile.Rotation = config.tileRotation
	tile.Position = TileBuilder._calculateTilePosition(config)

	TileBuilder._applyTileShape(tile, config, layer)

	return tile
end

function TileBuilder._calculateTilePosition(config: any): UDim2
	if config.gridOffsetX > 0 and config.gridOffsetY > 0 then
		return UDim2.fromOffset(config.gridOffsetX, config.gridOffsetY)
	elseif config.gridOffsetX > 0 then
		return UDim2.fromOffset(config.gridOffsetX, 0)
	elseif config.gridOffsetY > 0 then
		return UDim2.fromOffset(0, config.gridOffsetY)
	else
		return UDim2.fromScale(0, 0)
	end
end

function TileBuilder._applyTileShape(tile: Frame, config: any, layer: number?): ()
	if config.tileShape == Types.ShapeTypes.Square then
		TileBuilder._createSquareTile(tile, config)
	elseif config.tileShape == Types.ShapeTypes.Circle then
		TileBuilder._createCircleTile(tile, config, layer)
	end
end

function TileBuilder._createSquareTile(tile: Frame, config: any): ()
	tile.BackgroundTransparency = 1

	local stroke = Instance.new("UIStroke")
	stroke.Parent = tile
	stroke.Thickness = config.tileThickness
	stroke.Transparency = config.foregroundOpacity

	TileBuilder._applyForegroundColor(stroke, config)
end

function TileBuilder._createCircleTile(tile: Frame, config: any, layer: number?): ()
	local circle = Instance.new("Frame")
	circle.Parent = tile
	circle.ZIndex = (layer or 1) + 1
	circle.Size = UDim2.fromOffset(config.tileCircleSize, config.tileCircleSize)
	circle.Position = tile.Position

	local corner = Instance.new("UICorner")
	corner.Parent = circle
	corner.CornerRadius = UDim.new(1, 0)

	TileBuilder._applyForegroundColor(circle, config)
end

function TileBuilder._applyForegroundColor(instance: Frame | UIStroke, config: any): ()
	if config.foregroundGradient then
		BackgroundBuilder.applyGradient(instance, config.foregroundGradient)
	else
		if instance:IsA("UIStroke") then
			instance.Color = config.foregroundColor
		elseif instance:IsA("Frame") then
			instance.BackgroundColor3 = config.foregroundColor
		end
	end
end

-- Generates a grid of tiles across the background
function TileBuilder.generateTiles(background: Frame, config: any, layer: number?): ()
	TileBuilder._calculateTileDimensions(config)

	for x = 0, config.tileColumns - 1 do
		for y = 0, config.tileRows - 1 do
			local tile = TileBuilder.createTile(background, config, layer)
			tile.Position = UDim2.new(
				0, x * config.tileSize,
				0, y * config.tileSize
			)
		end

		-- Yield to prevent frame drops in performance mode
		if config.performanceMode then
			task.wait()
		end
	end
end

function TileBuilder._calculateTileDimensions(config: any): ()
	if config.tileRows == "@calc" then
		config.tileRows = math.ceil(2560 / config.tileSize)
	end

	if config.tileColumns == "@calc" then
		config.tileColumns = math.ceil(2560 / config.tileSize)
	end
end

return TileBuilder` 
            }
        ]
    }
  ];

  let selected = $state(null);

  function openProject(p) {
    selected = p;
    document.body.style.overflow = "hidden";
  }

  function closeProject() {
    selected = null;
    document.body.style.overflow = "";
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && selected) closeProject();
  }

  async function copyDiscord() {
    await navigator.clipboard.writeText("umb.rph");
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="wrapper">
<div class="root" class:dark>
  <button class="toggle" onclick={() => (dark = !dark)} aria-label="Toggle theme">
    {#if dark}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    {:else}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    {/if}
  </button>

  <main>
    <section class="hero">
      <h1>Hi! I'm <span class="name">Umbrix</span></h1>
      <div class="divider"></div>
      <p class="bio">
        Self-taught developer from Germany, 16. Writing code since 12.
        Started with HTML, got into Luau about three and a half years ago.
        I build game systems, frameworks, and Studio plugins.
        I'm constantly learning and trying to improve myself. 
      </p>

      <!-- 
      <div class="chips">
        <span class="chip">Luau</span>
        <span class="chip">UI/UX</span>
        <span class="chip">Roblox Studio</span>
        <span class="chip">SvelteKit</span>
        <span class="chip">TypeScript</span>
      </div>
    -->
    </section>

    <section class="work">
      <h2 class="section-label"></h2>
      <div class="grid">
        {#each projects as p}
          <button class="card" onclick={() => openProject(p)}>
            <div class="card-top">
              <span class="card-title">{p.title}</span>
              <svg class="arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
          </button>
        {/each}
      </div>
    </section>

    <footer>
      <button class="footer-link" onclick={copyDiscord} title="Copy Discord username">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.035.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
        {copied ? "copied!" : "discord"}
      </button>

      <a class="footer-link" href="https://github.com/umbrix-dev" target="_blank" rel="noopener">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        github
      </a>
    </footer>
  </main>

  {#if selected}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={closeProject}></div>
    <div class="overlay" role="dialog" aria-modal="true">
      <div class="overlay-inner">
        <div class="code-pane">
          <!-- <div class="code-header"> -->
            <!-- <span class="code-filename">{selected.title}.lua</span> -->
          <!-- </div> -->
          <div class="code-scroll">
                {#each selected.scripts as script}
                <div class="code-block">
                    <div class="code-header">
                    <span class="code-filename">{script.name}</span>
                    </div>
                    <pre><code>{script.content}</code></pre>
                </div>
                {/each}
          </div>
        </div>

        <div class="info-pane">
          <button class="close-btn" onclick={closeProject} aria-label="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div class="info-content">
            <h3 class="info-title">{selected.title}</h3>
            <p class="info-desc">{selected.description}</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=JetBrains+Mono:wght@400;500&display=swap');

:global(html), :global(body) {
  margin: 0;
  padding: 0;
}

.wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

  /* ── Variables ── */
  .root {
    --bg: #f4f1ec;
    --bg2: #edeae4;
    --border: #ccc8c0;
    --text: #1a1814;
    --muted: #6b6560;
    --code-bg: #eceae5;
    --code-text: #2a2520;
    --overlay-bg: rgba(26, 24, 20, 0.55);

    min-height: 100vh;
    background-color: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    transition: background-color 0.25s, color 0.25s;
    position: relative;
    height: 100%;
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .root.dark {
    --bg: #111010;
    --bg2: #1a1917;
    --border: #2b2926;
    --text: #e8e4dc;
    --muted: #78746e;
    --code-bg: #161513;
    --code-text: #d0ccc4;
    --overlay-bg: rgba(0, 0, 0, 0.7);
  }

  /* grain */
  .root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
    pointer-events: none;
    z-index: 0;
    opacity: 0.45;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  button { cursor: pointer; background: none; border: none; font-family: inherit; color: inherit; }

  main {
    position: relative;
    z-index: 1;
    max-width: 700px;
    margin: 0 auto;
    padding: 90px 32px 72px;
  }

  /* ── Toggle: fully circular ── */
  .toggle {
    position: fixed;
    top: 24px;
    right: 28px;
    z-index: 100;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    color: var(--muted);
    transition: border-color 0.2s, color 0.2s, background 0.25s;
  }
  .toggle:hover { color: var(--text); border-color: var(--text); }

  /* ── Hero ── */
  .hero { margin-bottom: 68px; }

  h1 {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(2.2rem, 6vw, 3.4rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.025em;
    margin-bottom: 22px;
  }

  .name {
    font-style: italic;
    position: relative;
  }
  .name::after {
    content: '';
    position: absolute;
    left: 0; bottom: 3px;
    width: 100%; height: 2px;
    background: var(--text);
    opacity: 0.18;
  }

  .divider {
    width: 34px; height: 1px;
    /* background: var(--border); */
    margin-bottom: 20px;
  }

  .bio {
    font-size: 0.975rem;
    line-height: 1.78;
    color: var(--muted);
    max-width: 540px;
    margin-bottom: 24px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
    letter-spacing: 0.03em;
  }

  /* ── Work ── */
  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 18px;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 9px;
  }

  .card {
    text-align: left;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg2);
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .card:hover {
    border-color: var(--text);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
  }
  .dark .card:hover {
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.32);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .arrow {
    opacity: 0.28;
    flex-shrink: 0;
    transition: opacity 0.15s, transform 0.15s;
  }
  .card:hover .arrow {
    opacity: 0.7;
    transform: translate(2px, -2px);
  }

  /* ── Footer ── */
  footer {
    margin-top: 68px;
    padding-top: 22px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }

  .footer-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 7px;
    text-decoration: none;
    transition: color 0.15s;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }
  .footer-link:hover { color: var(--text); }

  /* ── Overlay ── */
  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay-bg);
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    z-index: 200;
    animation: fadeIn 0.18s ease;
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 201;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .overlay-inner {
    width: 100%;
    max-width: 880px;
    height: min(80vh, 580px);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 18px;
    display: flex;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.16);
  }
  .dark .overlay-inner {
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  }

  .code-pane {
    flex: 1.3;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    min-width: 0;
  }

  .code-header {
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
    flex-shrink: 0;
  }

  .code-filename {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.06em;
  }

  .code-scroll {
    flex: 1;
    overflow-y: auto;
    background: var(--code-bg);
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  pre {
    padding: 20px;
    margin: 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.72;
    color: var(--code-text);
    white-space: pre;
    overflow-x: auto;
  }

  code { font-family: inherit; }

  .info-pane {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 14px; right: 14px;
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    background: var(--bg);
    transition: color 0.15s, border-color 0.15s;
    z-index: 1;
  }
  .close-btn:hover { color: var(--text); border-color: var(--text); }

  .info-content {
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
  }

  .info-title {
    font-family: 'Nunito', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: -0.015em;
    line-height: 1.2;
    padding-top: 22px;
  }

  .info-desc {
    font-size: 0.875rem;
    line-height: 1.72;
    color: var(--muted);
  }

  /* ── Animations ── */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    main { padding: 72px 20px 56px; }

    .overlay-inner {
      flex-direction: column;
      height: 88vh;
      border-radius: 14px;
    }

    .code-pane {
      flex: 1;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }

    .info-pane { width: 100%; }
    .info-content { padding: 16px; }
  }
</style>