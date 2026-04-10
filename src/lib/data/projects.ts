export const projects = [
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
    },
	{
		id: 6,
		title: "Centax"
		description: "A simple to use shared context module.",
		scripts: [
			{
				name: "Centax.luau",
				content: `--[[
	// Project
		Centax by @umbrix | Licensed under the "MIT" license.
		Discord: umb.rph
		Github: https://www.github.com/umbrix-dev/centax
	
	// Description
		A simple to use shared context module.
		Create, listen and manage existing events like "Players.PlayerAdded"
		or custom events in a shared context which you can access from the same side
		it got created in e.g. server or client.
	
	// API
		- insert(eventName: string, signal: RBXScriptSignal?) -> { destroy: () -> () }
		- fire<T...>(eventName: string, ...: T...)
		- exists(eventName: string): boolean
		- listen<T...>(eventName: string, callback: (T...) -> ()): { cancel: () -> () }?
		- cancel<T...>(eventName: string, callback: (T...) -> ())
		- clear(eventName: string?)
		- destroy(eventName: string)
		- once<T...>(eventName: string, callback: (T...) -> ())
		- build()
		
	// Examples usage (server)
	```
		local Players = game:GetService("Players")

		local ReplicatedStorage = game:GetService("ReplicatedStorage")
		local Centax = require(ReplicatedStorage.Centax)

		Centax.insert("PlayerAdded", Players.PlayerAdded)

		Centax.listen("PlayerAdded", function(player: Player)
			Centax.insert("CharacterAdded", player.CharacterAdded)
			Centax.insert("CharacterRemoving", player.CharacterRemoving)
			
			Centax.listen("CharacterAdded", function(character: Model)
				print("Character:", character.Name, "got added!")
			end)
			
			Centax.listen("CharacterRemoving", function(character: Model)
				print("Character:", character.Name, "got removed!")
			end)
		end)
	```
]]

--!strict
--!optimize 2

local RunService = game:GetService("RunService")

type Handler = {
	Event: RBXScriptSignal | "Custom",
	Callbacks: { (...any) -> () }
}

type Side = { [string]: Handler }

local Centax = {}

local server = {}
local client = {}
local connections: { RBXScriptConnection } = {}

local function getSide(): Side
	if RunService:IsServer() then
		return server
	else
		return client
	end
end

--[[
	Inserts an event with or without a signal.
	You can listen to an inserted event using 'Centax.listen("event name", callback)'.
	When not passing in a signal it will be treated as a custom event.
	Custom events need to be fired manually using 'Centax.fire("event name")'.
	Returns a destroy function to completely remove the event.
]]
function Centax.insert(eventName: string, signal: RBXScriptSignal?): { destroy: () -> () }
	local data: Handler = {
		Event = signal or "Custom",
		Callbacks = {}
	}
	
	getSide()[eventName] = data
	
	Centax.build()
	
	return {
		destroy = function()
			Centax.destroy(eventName)
		end,
	}
end

-- Fires a event without a signal also called an custom event.
function Centax.fire<T...>(eventName: string, ...: T...)
	if not Centax.exists(eventName) then
		return
	end
	
	local handler: Handler = getSide()[eventName]
	if handler.Event ~= "Custom" then
		return
	end
	
	for _, callback in pairs(handler.Callbacks) do
		callback(...)
	end
end

--[[
	Check if a specific event exists.
	Returns a boolean to let you know.
]]
function Centax.exists(eventName: string): boolean
	local side = getSide()
	if not side[eventName] then
		return false
	else
		return true
	end
end

--[[
	Listen to a specific event and attach a callback that will run once it fires.
	Will work on events with and without a signal.
	Returns a cancel function which will remove the callback from the event or nil when the event was not found.
]]
function Centax.listen<T...>(eventName: string, callback: (T...) -> ()): { cancel: () -> () }?
	if not Centax.exists(eventName) then
		return nil
	end

	local callbacks = getSide()[eventName].Callbacks
	table.insert(callbacks, callback :: (...any) -> ())
	
	return {
		cancel = function()
			Centax.cancel(eventName, callback)
		end,
	}
end


-- Remove a event listener / callback from an event.
function Centax.cancel<T...>(eventName: string, callback: (T...) -> ())
	local callbacks = getSide()[eventName].Callbacks
	local index = table.find(callbacks, callback :: (...any) -> ())
	if not index then
		return
	end
	
	table.remove(callbacks, index)
end

-- Clear all or a specific event's callbacks
function Centax.clear(eventName: string?)
	local side = getSide()
	
	if eventName then
		if not Centax.exists(eventName) then
			return
		end
		
		local handler: Handler = side[eventName]
		handler.Callbacks = {}
	else
		for _, handler: Handler in pairs(side) do
			handler.Callbacks = {}
		end
	end
end

-- Remove a event
function Centax.destroy(eventName: string)
	if Centax.exists(eventName) then
		getSide()[eventName] = nil
		Centax.build()
	end
end

-- Similar to "Centax.listen" but will cancel itself after being fired.
function Centax.once<T...>(eventName: string, callback: (T...) -> ())
	local newCallback
	newCallback = function(...)
		callback(...)
		Centax.cancel(eventName, newCallback :: (...any) -> ())
	end
	
	Centax.listen(eventName, newCallback)
end

-- Clean and build all connections and connect their callbacks.
-- Will be executed automatically when inserting or destroying a event.
function Centax.build()
	for _, connection: RBXScriptConnection in pairs(connections) do
		connection:Disconnect()
	end
	
	table.clear(connections)
	
	for _, handler: Handler in pairs(getSide()) do
		if handler.Event == "Custom" then
			continue
		end
		
		local connection = handler.Event:Connect(function(...)
			for _, callback in pairs(handler.Callbacks) do
				callback(...)
			end
		end)
		
		table.insert(connections, connection)
	end
end

return Centax`
			}
		]
	},
];
