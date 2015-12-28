<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Result
 *
 * @ORM\Table(name="result")
 * @ORM\Entity(repositoryClass="Pouce\TeamBundle\Entity\ResultRepository")
 */
class Result
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\OneToOne(targetEntity="Pouce\TeamBundle\Entity\Team", inversedBy="result")
    */
    private $team;

    /**
     * @ORM\OneToOne(targetEntity="Pouce\TeamBundle\Entity\Comment", cascade={"remove", "persist"})
     */
    private $comment;

    /**
     * @var integer
     *
     * @ORM\Column(name="lateness", type="integer")
     */
    private $lateness;

    /**
     * @var boolean
     *
     * @ORM\Column(name="isValid", type="boolean")
     */
    private $isValid;

    /**
     * @ORM\Column(name="nbCar", type="integer", nullable=true)
    */
    private $nbCar;


    /**
     * @ORM\Column(name="avis", type="text", nullable=true)
    */
    private $avis;

    /**
     * @ORM\Column(name="sponsort", type="boolean", nullable=true)
    */
    private $sponsort;

    /**
     * @ORM\OneToOne(targetEntity="Pouce\TeamBundle\Entity\Position", cascade={"persist"})
     * @ORM\JoinColumn(nullable=false)
    */
    private $position;

    /**
     * @var integer
     *
     * @ORM\Column(name="rank", type="integer")
     */
    private $rank;

    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }


    /**
     * Set lateness
     *
     * @param integer $lateness
     * @return Result
     */
    public function setLateness($lateness)
    {
        $this->lateness = $lateness;

        return $this;
    }

    /**
     * Get lateness
     *
     * @return integer 
     */
    public function getLateness()
    {
        return $this->lateness;
    }

    /**
     * Set isValid
     *
     * @param boolean $isValid
     * @return Result
     */
    public function setIsValid($isValid)
    {
        $this->isValid = $isValid;

        return $this;
    }

    /**
     * Get isValid
     *
     * @return boolean 
     */
    public function getIsValid()
    {
        return $this->isValid;
    }

    /**
     * Set team
     *
     * @param \Pouce\TeamBundle\Entity\Team $team
     * @return Result
     */
    public function setTeam(\Pouce\TeamBundle\Entity\Team $team)
    {
        $this->team = $team;

        $team->setResult($this);

        return $this;
    }

    /**
     * Get team
     *
     * @return \Pouce\TeamBundle\Entity\Team 
     */
    public function getTeam()
    {
        return $this->team;
    }

    /**
     * Set position
     *
     * @param \Pouce\TeamBundle\Entity\Position $position
     * @return Result
     */
    public function setPosition(\Pouce\TeamBundle\Entity\Position $position)
    {
        $this->position = $position;

        return $this;
    }

    /**
     * Get position
     *
     * @return \Pouce\TeamBundle\Entity\Position 
     */
    public function getPosition()
    {
        return $this->position;
    }

    /**
     * Set rank
     *
     * @param integer $rank
     * @return Result
     */
    public function setRank($rank)
    {
        $this->rank = $rank;

        return $this;
    }

    /**
     * Get rank
     *
     * @return integer 
     */
    public function getRank()
    {
        return $this->rank;
    }

    /**
     * Set comment
     *
     * @param \Pouce\TeamBundle\Entity\Comment $comment
     * @return Result
     */
    public function setComment(\Pouce\TeamBundle\Entity\Comment $comment = null)
    {
        $this->comment = $comment;

        return $this;
    }

    /**
     * Get comment
     *
     * @return \Pouce\TeamBundle\Entity\Comment 
     */
    public function getComment()
    {
        return $this->comment;
    }

    /**
     * Set nbCar
     *
     * @param integer $nbCar
     * @return Result
     */
    public function setNbCar($nbCar)
    {
        $this->nbCar = $nbCar;

        return $this;
    }

    /**
     * Get nbCar
     *
     * @return integer 
     */
    public function getNbCar()
    {
        return $this->nbCar;
    }

    /**
     * Set avis
     *
     * @param string $avis
     * @return Result
     */
    public function setAvis($avis)
    {
        $this->avis = $avis;

        return $this;
    }

    /**
     * Get avis
     *
     * @return string 
     */
    public function getAvis()
    {
        return $this->avis;
    }

    /**
     * Set sponsort
     *
     * @param boolean $sponsort
     * @return Result
     */
    public function setSponsort($sponsort)
    {
        $this->sponsort = $sponsort;

        return $this;
    }

    /**
     * Get sponsort
     *
     * @return boolean 
     */
    public function getSponsort()
    {
        return $this->sponsort;
    }
}
