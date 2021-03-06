(function() {
	var $playButton = $("#play"),
		$playVersusButton = $("#versus"),
		$playAgainButton = $("#playAgain"),
		$difficultyDropdown = $("#difficulty"),
		$difficultyOptions = $(".difficulty-options"),
		$userForm = $("#userform"),
		$versusForm = $("#versusform"),
		$usernameInputField = $("#username"),
		$playerOneInputField = $("#playerOne"),
		$playerTwoInputField = $("#playerTwo"),
		$usernameSubmitBtn = $("#submitUsername"),
		$versusSubmitBtn = $("#submitVersus"),
		$gameField = $("#gameField"),
		$gameTiles = $(".game-tile"),
		$resetGame = $("#resetGame"),
		$endGameContainer = $("#end-game"),
		$endGameImage = $("#end-game-image"),
		impossibleStrategy = "none",
		impossibleDivToMark,
		impossibleDivToMarkCounter,
		impossibleDivToMarkForWinning,
		isPlayerO = false,
		isGameOver = false,
		isHardDifficulty = false,
		isTwoPlayerGame = false,
		difficulty,
		username,
		playerOneUsername,
		playerTwoUsername,
		currentX = 0,
		currentY = 0,
		endGameContainerSize = parseFloat($endGameContainer.css('width')),
		orientation,
		fadeTime = 1500,
		endGameAudio;

	$endGameContainer.hide();
	$resetGame.hide();
	$difficultyDropdown.hide();
	$userForm.hide();
	$versusForm.hide();
	$playAgainButton.hide();
	$gameField.hide();
	$difficultyOptions.on('click', chooseDifficulty);
	$playButton.on('click', play);
	$playVersusButton.on('click', playVersus);
	$usernameSubmitBtn.on('click', enterUserName);
	$versusSubmitBtn.on('click', enterPlayerUserNames);
	$gameTiles.on('click', takeTurn);
	$playAgainButton.on('click', playAgain);

	$resetGame.click(function() {
		location.reload();
	});

	function playAgain() {
		endGameAudio.pause();
		$playAgainButton.hide();
		$endGameContainer.hide();
		$('.played-by-o').removeClass('played-by-o').text('');
		$('.played-by-x').removeClass('played-by-x').text('');
		isGameOver = false;
		isPlayerO = getRandomBool();
		if (!getRandomBool() && !isTwoPlayerGame) {
			decideTurn(true);
		}
	}

	function chooseDifficulty() {
		difficulty = $(this).text();
		$('#playerTwoName').append('CPU(' + difficulty + ')');
		$difficultyDropdown.hide();
		$("#playerOneName").text(username);

		$gameField.show();
		$resetGame.show();

		isPlayerO = getRandomBool();
		if (!getRandomBool()) {
			decideTurn(true);
		}
	}

	function play() {
		$(this).hide();
		$playVersusButton.hide();
		$userForm.show();
	}

	function playVersus() {
		$(this).hide();
		$playButton.hide();
		$versusForm.show();
	}

	function enterUserName() {
		username = $usernameInputField.val() || "Anonymous";
		$userForm.hide();
		$difficultyDropdown.show();
	}

	function enterPlayerUserNames() {
		playerOneUsername = $playerOneInputField.val() || "Player One";
		playerTwoUsername = $playerTwoInputField.val() || "Player Two";
		$versusForm.hide();
		$("#playerOneName").text(playerOneUsername);
		$("#playerTwoName").text(playerTwoUsername);

		isTwoPlayerGame = true;

		$gameField.show();
		$resetGame.show();
	}

	function moveEndGameImage(event) {
		var viewport = {
				width  : $(window).width(),
				height : $(window).height()
			},
			currentTop = parseFloat($endGameContainer.css('top')) || 0,
			currentLeft = parseFloat($endGameContainer.css('left')) || 0,
			beta = window.orientation === 0 ? event.beta : event.gamma,
			gamma = window.orientation === 0 ? event.gamma : event.beta,
			conditionTop = window.orientation !== 90 ? currentY > beta : currentY < beta,
			conditionLeft = window.orientation !== -90 && window.orientation !== 270 ? currentX > gamma : currentX < gamma;

		if (conditionTop) {
			currentTop = currentTop >= endGameContainerSize - viewport.height ? currentTop - 10 : currentTop;
		} else {
			currentTop = currentTop + endGameContainerSize >= viewport.height ? viewport.height - endGameContainerSize : currentTop + 10;
		}

		if (conditionLeft) {
			currentLeft = currentLeft >= endGameContainerSize - viewport.width ? currentLeft - 10 : currentLeft;
		} else {
			currentLeft = currentLeft + endGameContainerSize >= viewport.width ? viewport.width - endGameContainerSize : currentLeft + 10;
		}

		$endGameContainer.css({'top' : currentTop + 'px'});
		$endGameContainer.css({'left' : currentLeft + 'px'});
	}

	function endGame(imagePath) {
		isGameOver = true;
		endGameAudio = new Audio('sound/endgame.mp3');
		endGameAudio.play();
		$endGameContainer.css({'top' : 0, 'left': 0});
		$endGameImage.attr("src", imagePath);
		$endGameContainer.fadeIn(fadeTime);
		$playAgainButton.show();
		impossibleStrategy = "none";
		setTimeout(function(){ 
			if(window.DeviceOrientationEvent) {
				window.addEventListener('deviceorientation', moveEndGameImage, false);
			}
		}, fadeTime);
	}

	function takeTurn() {
		if (isGameOver) {
			return this;
		}

		var $this = $(this);

		if ($this.hasClass('played-by-x') || $this.hasClass('played-by-o')) {
			return $this;
		}

		if (isPlayerO) {
			$(this).addClass('played-by-o');
			$(this).text("O");
		} else {
			$(this).addClass('played-by-x');
			$(this).text("X");
		}



		checkWin(true, isPlayerO);
		if (isDraw() && !isGameOver) {
			endGame("images/draw.png");
			return this;
		}

		if (!isGameOver && !isTwoPlayerGame) {
			decideTurn(false);
			checkWin(false, !isPlayerO);
		} else if (isTwoPlayerGame) {
			isPlayerO = !isPlayerO;
			checkWin(false, isPlayerO);
		}

		if (isDraw() && !isGameOver) {
			endGame("images/draw.png");
			return this;
		}

	}

	function decideTurn(isFirstTurn) {
		switch (difficulty) {
			case "Easy":
				takeTurnEasy();
				return;
			case "Normal":
				takeTurnNormal(isFirstTurn);
				return;
			case "Hard":
				isHardDifficulty = true;
			case "Impossible":
				takeTurnImpossible(isFirstTurn);
				return;
			default:
				alert("This should not happen!");
		}
	}

	function aiMarkDiv($div) {
		if (isPlayerO) {
			$div.addClass('played-by-x');
			$div.text("X");
		} else {
			$div.addClass('played-by-o');
			$div.text("O");
		}
	}

	function takeTurnEasy() {
		while (true) {
			var $div = $('#' + getRandomNumberFrom1To9());
			if ($div.hasClass('played-by-x') || $div.hasClass('played-by-o')) {
				continue;
			}
			aiMarkDiv($div);
			break;
		}
	}

	function takeTurnNormal(isFirstTurn) {
		if (getRandomBool()) {
			takeTurnEasy();
		} else {
			takeTurnImpossible(isFirstTurn);
		}
	}

	function takeTurnImpossible(isFirstTurn) {
		if (winIfPossible()) {
			aiMarkDiv($('#' + impossibleDivToMarkForWinning));
			return this;
		}

		if (stopPlayerFromWinningIfPossible()) {
			aiMarkDiv($('#' + impossibleDivToMark));
			return this;
		}

		if (counterPlayerStrategyIfPossible()) {
			aiMarkDiv($('#' + impossibleDivToMarkCounter));
			return this;
		}

		if (isFirstTurn) {
			switch (getRandomNumberFrom1To9() % 3) {
				case 0:
					impossibleStrategy = "Corner";
					break;
				case 1:
					impossibleStrategy = "Edge"
					break;
				case 2:
					impossibleStrategy = "Middle"
					break;
			}
		}

		var playerMove = isPlayerO ? $($('.played-by-o')).attr('id') : $($('.played-by-x')).attr('id');

		if (impossibleStrategy == "none") {
			impossibleStrategy = getStrategyByPlayerMove(playerMove);
		}

		var aiMovesCount = getAITiles().length;

		switch (impossibleStrategy) {
			case "Edge":
				executeEdgeStrategy(aiMovesCount);
				break;
			case "Corner":
				executeCornerStategy(aiMovesCount);
				break;
			case "Middle":
				executeMiddleStategy(aiMovesCount);
				break;
		}
	}

	function placeOnRandomOfFour(one, two, three, four) {
		switch (getRandomNumberFrom1To9() % 4) {
			case 0:
				aiMarkDiv($('#' + one));
				return;
			case 1:
				aiMarkDiv($('#' + two));
				return;
			case 2:
				aiMarkDiv($('#' + three));
				return;
			case 3:
				aiMarkDiv($('#' + four));
				return;
		}
	}

	function isDivTaken(divId) {
		var div = $("#" + divId);
		return div.hasClass('played-by-o') || div.hasClass('played-by-x');
	}

	function executeMiddleStategy(movesMadeSoFar) {
		if (movesMadeSoFar === 0) {
			aiMarkDiv($('#' + 5));
		} else {
			var aiTiles = getAITiles();
			var playerNumbers = getPlayerTiles();
			if (movesMadeSoFar === 1) {
				if (playerNumbers.length == 1) {
					switch (playerNumbers[0]) {
						case "1":
							aiMarkDiv($('#' + 9));
							return;
						case "3":
							aiMarkDiv($('#' + 7));
							return;
						case "7":
							aiMarkDiv($('#' + 3));
							return;
						case "9":
							aiMarkDiv($('#' + 1));
							return;
						default:
							placeOnRandomOfFour(1, 3, 7, 9);
							return;
					}
				} else {
					if (containsAll(["1", "9"], playerNumbers) || containsAll(["3", "7"], playerNumbers)) {
						placeOnRandomOfFour(2, 4, 6, 8);
						return;
					} else {
						takeTurnEasy();
						return;
					}
				}
			}
			if (movesMadeSoFar === 2) {
				if ($.inArray("1", aiTiles) !== -1) {
					if ($.inArray("2", playerNumbers) && !isDivTaken(7)) {
						aiMarkDiv($('#' + 7));
						return;
					} else if ($.inArray("4", playerNumbers) && !isDivTaken(3)) {
						aiMarkDiv($('#' + 3));
						return;
					}

				}
				if ($.inArray("3", aiTiles) !== -1 && !isDivTaken(1)) {
					if ($.inArray("2", playerNumbers) && !isDivTaken(9)) {
						aiMarkDiv($('#' + 9));
						return;
					} else if ($.inArray("6", playerNumbers) && !isDivTaken(1)) {
						aiMarkDiv($('#' + 1));
						return;
					}
				}
				if ($.inArray("7", aiTiles) !== -1 && !isDivTaken(9)) {
					if ($.inArray("8", playerNumbers) && !isDivTaken(1)) {
						aiMarkDiv($('#' + 1));
						return;
					} else if ($.inArray("4", playerNumbers) && !isDivTaken(9)) {
						aiMarkDiv($('#' + 9));
						return;
					}
				}
				if ($.inArray("9", aiTiles) !== -1 && !isDivTaken(7)) {
					if ($.inArray("6", playerNumbers) && !isDivTaken(7)) {
						aiMarkDiv($('#' + 7));
						return;
					} else if ($.inArray("8", playerNumbers) && !isDivTaken(3)) {
						aiMarkDiv($('#' + 3));
						return;
					}
				}
			}
			takeTurnEasy();
		}
	}

	function executeCornerStategy(movesMadeSoFar) {
		if (movesMadeSoFar === 0) {
			var playerNumbers = getPlayerTiles();
			if (playerNumbers.length === 0 || isHardDifficulty || $.inArray("5", playerNumbers) !== -1) {
				placeOnRandomOfFour(1, 3, 7, 9);
				return;
			} else {
				if ($.inArray("2", playerNumbers) !== -1) {
					markRandomOptionOutOfThree(1, 5, 3);
					return this;
				} else if ($.inArray("4", playerNumbers) !== -1) {
					markRandomOptionOutOfThree(1, 5, 7);
					return this;
				} else if ($.inArray("6", playerNumbers) !== -1) {
					markRandomOptionOutOfThree(3, 5, 9);
					return this;
				} else if ($.inArray("8", playerNumbers) !== -1) {
					markRandomOptionOutOfThree(7, 5, 9);
					return this;
				}
			}
		} else {
			var aiTiles = getAITiles();
			if (movesMadeSoFar === 1) {
				if ($.inArray("5", aiTiles) === -1 && !isDivTaken(5)) {
					aiMarkDiv($('#' + 5));
					return;
				} else {
					if ($.inArray("1", aiTiles) !== -1 && !isDivTaken(9)) {
						aiMarkDiv($('#' + 9));
						return;
					}

					if ($.inArray("3", aiTiles) !== -1 && !isDivTaken(7)) {
						aiMarkDiv($('#' + 7));
						return;
					}

					if ($.inArray("7", aiTiles) !== -1 && !isDivTaken(3)) {
						aiMarkDiv($('#' + 3));
						return;
					}

					if ($.inArray("9", aiTiles) !== -1 && !isDivTaken(1)) {
						aiMarkDiv($('#' + 1));
						return;
					}
				}
			}

			if (movesMadeSoFar === 2) {
				if (containsAll(["1", "9"], aiTiles)) {
					if (getRandomBool() && !isDivTaken(7)) {
						aiMarkDiv($('#' + 7));
						return;
					}

					if (!isDivTaken(3)) {
						aiMarkDiv($('#' + 3));
						return;
					}
				}

				if (containsAll(["3", "7"], aiTiles)) {
					if (getRandomBool() && !isDivTaken(1)) {
						aiMarkDiv($('#' + 1));
						return;
					}

					if (!isDivTaken(9)) {
						aiMarkDiv($('#' + 9));
						return;
					}
				}
			}

			takeTurnEasy();
		}
	}

	function executeEdgeStrategy(movesMadeSoFar) {
		if (movesMadeSoFar === 0) {
			placeOnRandomOfFour(2, 4, 6, 8);
			return;
		} else {
			var aiTiles = getAITiles(),
				playerTiles = getPlayerTiles();

			if (movesMadeSoFar === 1) {
				if ($.inArray("5", aiTiles) === -1 && !isDivTaken(5)) {
					aiMarkDiv($('#' + 5));
					return;
				} else if ($.inArray("2", aiTiles) !== -1 || $.inArray("8", aiTiles) !== -1) {
					if (getRandomBool() && !isDivTaken(4)) {
						aiMarkDiv($('#' + 4));
						return;
					}
					if (!isDivTaken(6)) {
						aiMarkDiv($('#' + 6));
						return;
					}
				} else {
					if (getRandomBool() && !isDivTaken(2)) {
						aiMarkDiv($('#' + 2));
						return;
					}
					if (!isDivTaken(8)) {
						aiMarkDiv($('#' + 8));
						return;
					}
				}
			}

			if (movesMadeSoFar === 2) {
				if ($.inArray("2", aiTiles) !== -1) {
					if ($.inArray("4", aiTiles) !== -1 && !isDivTaken(1)) {
						aiMarkDiv($('#' + 1));
						return;
					} else if (!isDivTaken(3) && isHardDifficulty) {
						aiMarkDiv($('#' + 3));
						return;
					} else if (containsAll(["1", "8"], playerTiles) || containsAll(["3", "8"], playerTiles)) {
						placeOnRandomOfFour(4, 6, 7, 9);
						return;
					}
				}

				if ($.inArray("4", aiTiles) !== -1) {
					if ($.inArray("8", aiTiles) !== -1 && !isDivTaken(7)) {
						aiMarkDiv($('#' + 7));
						return;
					} else if (!isDivTaken(1) && isHardDifficulty) {
						aiMarkDiv($('#' + 1));
						return;
					} else if (containsAll(["7", "6"], playerTiles) || containsAll(["1", "6"], playerTiles)) {
						placeOnRandomOfFour(2, 3, 8, 9);
						return;
					}
				}

				if ($.inArray("6", aiTiles) !== -1) {
					if ($.inArray("8", aiTiles) !== -1 && !isDivTaken(9)) {
						aiMarkDiv($('#' + 9));
						return;
					} else if (!isDivTaken(3) && isHardDifficulty) {
						aiMarkDiv($('#' + 3));
						return;
					} else if (containsAll(["4", "3"], playerTiles) || containsAll(["4", "9"], playerTiles)) {
						placeOnRandomOfFour(1, 2, 7, 8);
						return;
					}
				}

				if ($.inArray("8", aiTiles) !== -1) {
					if ($.inArray("4", aiTiles) !== -1 && !isDivTaken(7)) {
						aiMarkDiv($('#' + 7));
						return;
					} else if (!isDivTaken(9) && isHardDifficulty) {
						aiMarkDiv($('#' + 9));
						return;
					} else if (containsAll(["2", "7"], playerTiles) || containsAll(["2", "9"], playerTiles)) {
						placeOnRandomOfFour(1, 3, 4, 6);
						return;
					}
				}
			}

			takeTurnEasy();
		}
	}

	function getStrategyByPlayerMove(playerMove) {
		switch (parseInt(playerMove)) {
			case 5:
				return "Corner";
			case 1:
			case 3:
			case 7:
			case 9:
				return "Middle";
			case 2:
			case 4:
			case 6:
			case 8:
				return getRandomBool() ? "Middle" : "Corner";
			default:
				alert("This should not happen while choosing strategy!");
				return "Middle";
		}
	}

	function getRandomBool() {
		return parseInt(Math.random() * 100) % 2 == 1 ? true : false;
	}

	function getRandomNumberFrom1To9() {
		return parseInt(Math.random() * 100) % 9 + 1;
	}

	function isDraw() {
		return ($('.played-by-o').length + $('.played-by-x').length) == 9;
	}

	function checkWin(hasPlayerPlayed, checkO) {
		var $totalTiles;
		if (checkO) {
			$totalTiles = $('.played-by-o');
		} else {
			$totalTiles = $('.played-by-x');
		}

		if ($totalTiles.length < 3) {
			return this;
		}

		var numbers = [];
		for (var i = 0; i < $totalTiles.length; i++) {
			var $div = $($totalTiles[i]);
			numbers.push($div.attr('id'));
		};

		if (checkRows(numbers) || checkCols(numbers) || checkDiagonals(numbers)) {
			if (isTwoPlayerGame) {
				if (checkO) {
					endGame("images/winO.png");
				} else {
					endGame("images/winX.png");
				}
			} else {
				if (hasPlayerPlayed) {
					endGame("images/win.png");
				} else {
					endGame("images/lose.png");
				}
			}
		}

	}

	function checkRows(numbers) {
		if ($.inArray("1", numbers) !== -1 && $.inArray("2", numbers) !== -1 && $.inArray("3", numbers) !== -1) {
			return true;
		}
		if ($.inArray("4", numbers) !== -1 && $.inArray("5", numbers) !== -1 && $.inArray("6", numbers) !== -1) {
			return true;
		}
		if ($.inArray("7", numbers) !== -1 && $.inArray("8", numbers) !== -1 && $.inArray("9", numbers) !== -1) {
			return true;
		}
		return false;
	}

	function checkCols(numbers) {
		if ($.inArray("1", numbers) !== -1 && $.inArray("4", numbers) !== -1 && $.inArray("7", numbers) !== -1) {
			return true;
		}
		if ($.inArray("2", numbers) !== -1 && $.inArray("5", numbers) !== -1 && $.inArray("8", numbers) !== -1) {
			return true;
		}
		if ($.inArray("3", numbers) !== -1 && $.inArray("6", numbers) !== -1 && $.inArray("9", numbers) !== -1) {
			return true;
		}
		return false;
	}

	function checkDiagonals(numbers) {
		if ($.inArray("1", numbers) !== -1 && $.inArray("5", numbers) !== -1 && $.inArray("9", numbers) !== -1) {
			return true;
		}
		if ($.inArray("7", numbers) !== -1 && $.inArray("5", numbers) !== -1 && $.inArray("3", numbers) !== -1) {
			return true;
		}
		return false;
	}

	function winIfPossible() {
		var aiTiles = getAITiles();

		if ((containsAll(["2", "3"], aiTiles) || containsAll(["5", "9"], aiTiles) || containsAll(["4", "7"], aiTiles)) && !isDivTaken(1)) {
			impossibleDivToMarkForWinning = 1;
			return true;
		}
		if ((containsAll(["1", "3"], aiTiles) || containsAll(["5", "8"], aiTiles)) && !isDivTaken(2)) {
			impossibleDivToMarkForWinning = 2;
			return true;
		}
		if ((containsAll(["1", "2"], aiTiles) || containsAll(["5", "7"], aiTiles) || containsAll(["6", "9"], aiTiles)) && !isDivTaken(3)) {
			impossibleDivToMarkForWinning = 3;
			return true;
		}
		if ((containsAll(["5", "6"], aiTiles) || containsAll(["1", "7"], aiTiles)) && !isDivTaken(4)) {
			impossibleDivToMarkForWinning = 4;
			return true;
		}
		if ((containsAll(["1", "9"], aiTiles) || containsAll(["3", "7"], aiTiles) || containsAll(["4", "6"], aiTiles) || containsAll(["2", "8"], aiTiles)) && !isDivTaken(5)) {
			impossibleDivToMarkForWinning = 5;
			return true;
		}
		if ((containsAll(["4", "5"], aiTiles) || containsAll(["3", "9"], aiTiles)) && !isDivTaken(6)) {
			impossibleDivToMarkForWinning = 6;
			return true;
		}
		if ((containsAll(["1", "4"], aiTiles) || containsAll(["3", "5"], aiTiles) || containsAll(["8", "9"], aiTiles)) && !isDivTaken(7)) {
			impossibleDivToMarkForWinning = 7;
			return true;
		}
		if ((containsAll(["2", "5"], aiTiles) || containsAll(["7", "9"], aiTiles)) && !isDivTaken(8)) {
			impossibleDivToMarkForWinning = 8;
			return true;
		}
		if ((containsAll(["7", "8"], aiTiles) || containsAll(["3", "6"], aiTiles) || containsAll(["1", "5"], aiTiles)) && !isDivTaken(9)) {
			impossibleDivToMarkForWinning = 9;
			return true;
		}
		return false;
	}

	function counterPlayerStrategyIfPossible() {
		var playerNumbers = getPlayerTiles(),
			aiNumbers = getAITiles();
		if (playerNumbers.length === 2) {
			if (containsAll(["1", "5"], playerNumbers) || containsAll(["5", "9"], playerNumbers)) {
				if (getRandomBool() && !isDivTaken(7)) {
					impossibleDivToMarkCounter = 7;
					return true;
				}
				if (!isDivTaken(3)) {
					impossibleDivToMarkCounter = 3;
					return true;
				}
			} else if (containsAll(["5", "7"], playerNumbers) || containsAll(["3", "5"], playerNumbers)) {
				if (getRandomBool() && !isDivTaken(1)) {
					impossibleDivToMarkCounter = 1;
					return true;
				}
				if (!isDivTaken(9)) {
					impossibleDivToMarkCounter = 9;
					return true;
				}
			} else if (aiNumbers.length === 1 && $.inArray("5", aiNumbers) !== -1) {
				if (containsAll(["2", "7"], playerNumbers) || containsAll(["2", "4"], playerNumbers) || containsAll(["3", "4"], playerNumbers)) {
					impossibleDivToMarkCounter = 1;
					return true;
				}
				if (containsAll(["2", "9"], playerNumbers) || containsAll(["2", "6"], playerNumbers) || containsAll(["1", "6"], playerNumbers)) {
					impossibleDivToMarkCounter = 3;
					return true;
				}
				if (containsAll(["1", "8"], playerNumbers) || containsAll(["4", "8"], playerNumbers) || containsAll(["4", "9"], playerNumbers)) {
					impossibleDivToMarkCounter = 7;
					return true;
				}
				if (containsAll(["3", "8"], playerNumbers) || containsAll(["6", "8"], playerNumbers) || containsAll(["6", "7"], playerNumbers)) {
					impossibleDivToMarkCounter = 9;
					return true;
				}
			}

		}

		return false;
	}

	function stopPlayerFromWinningIfPossible() {
		var playerNumbers = getPlayerTiles();
		var aiTiles = getAITiles();
		impossibleDivToMark = impossibleDivToMark || 0;
		if ((containsAll(["2", "3"], playerNumbers) || containsAll(["5", "9"], playerNumbers) || containsAll(["4", "7"], playerNumbers)) && $.inArray("1", aiTiles) === -1) {
			impossibleDivToMark = 1;
			return true;
		}
		if ((containsAll(["1", "3"], playerNumbers) || containsAll(["5", "8"], playerNumbers)) && $.inArray("2", aiTiles) === -1) {
			impossibleDivToMark = 2;
			return true;
		}
		if ((containsAll(["1", "2"], playerNumbers) || containsAll(["5", "7"], playerNumbers) || containsAll(["6", "9"], playerNumbers)) && $.inArray("3", aiTiles) === -1) {
			impossibleDivToMark = 3;
			return true;
		}
		if ((containsAll(["5", "6"], playerNumbers) || containsAll(["1", "7"], playerNumbers)) && $.inArray("4", aiTiles) === -1) {
			impossibleDivToMark = 4;
			return true;
		}
		if ((containsAll(["1", "9"], playerNumbers) || containsAll(["3", "7"], playerNumbers) || containsAll(["4", "6"], playerNumbers) || containsAll(["2", "8"], playerNumbers)) && $.inArray("5", aiTiles) === -1) {
			impossibleDivToMark = 5;
			return true;
		}
		if ((containsAll(["4", "5"], playerNumbers) || containsAll(["3", "9"], playerNumbers)) && $.inArray("6", aiTiles) === -1) {
			impossibleDivToMark = 6;
			return true;
		}
		if ((containsAll(["1", "4"], playerNumbers) || containsAll(["3", "5"], playerNumbers) || containsAll(["8", "9"], playerNumbers)) && $.inArray("7", aiTiles) === -1) {
			impossibleDivToMark = 7;
			return true;
		}
		if ((containsAll(["2", "5"], playerNumbers) || containsAll(["7", "9"], playerNumbers)) && $.inArray("8", aiTiles) === -1) {
			impossibleDivToMark = 8;
			return true;
		}
		if ((containsAll(["7", "8"], playerNumbers) || containsAll(["3", "6"], playerNumbers) || containsAll(["1", "5"], playerNumbers)) && $.inArray("9", aiTiles) === -1) {
			impossibleDivToMark = 9;
			return true;
		}
		return false;
	}

	function markRandomOptionOutOfThree(option1, option2, option3) {
		switch (getRandomNumberFrom1To9() % 3) {
			case 0:
				aiMarkDiv($('#' + option1));
				return;
			case 1:
				aiMarkDiv($('#' + option2));
				return;
			case 2:
				aiMarkDiv($('#' + option3));
				return;
		}
	}

	function getPlayerTiles() {
		var $totalTiles;
		if (isPlayerO) {
			$totalTiles = $('.played-by-o');
		} else {
			$totalTiles = $('.played-by-x');
		}

		var numbers = [];
		for (var i = 0; i < $totalTiles.length; i++) {
			var $div = $($totalTiles[i]);
			numbers.push($div.attr('id'));
		};

		return numbers;
	}

	function getAITiles() {
		var $totalTiles;
		if (isPlayerO) {
			$totalTiles = $('.played-by-x');
		} else {
			$totalTiles = $('.played-by-o');
		}

		var numbers = [];
		for (var i = 0; i < $totalTiles.length; i++) {
			var $div = $($totalTiles[i]);
			numbers.push($div.attr('id'));
		};

		return numbers;
	}

	function containsAll(needles, haystack) {
		for (var i = 0, len = needles.length; i < len; i++) {
			if ($.inArray(needles[i], haystack) == -1) return false;
		}
		return true;
	}
}());