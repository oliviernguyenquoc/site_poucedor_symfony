<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Position
 *
 * @ORM\Table(name="position")
 * @ORM\Entity(repositoryClass="Pouce\TeamBundle\Entity\PositionRepository")
 */
class Position
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
     * @var string
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="city", type="string", length=255)
    */
    private $city;

    /**
     * @ORM\ManyToOne(targetEntity="Pouce\SiteBundle\Entity\Country")
     * @ORM\JoinColumn(nullable=false)
    */
    private $country;

    /**
     * @var float
     *
     * @ORM\Column(name="distance", type="float", nullable=true)
     */
    private $distance;

    /**
     * @ORM\ManyToOne(targetEntity="Pouce\TeamBundle\Entity\Team")
     * @ORM\JoinColumn(nullable=false)
    */
    private $team;

    /**
     * @ORM\ManyToOne(targetEntity="Pouce\SiteBundle\Entity\Edition")
     * @ORM\JoinColumn(nullable=false)
    */
    private $edition;

    /**
     * @var float
     * @Assert\Range(min=-180)
     * @Assert\Range(max=180)
     *
     * @ORM\Column(name="longitude", type="float", nullable=true)
     */
    private $longitude;

    /**
     * @var float
     * @Assert\Range(min=-90)
     * @Assert\Range(max=90)
     *
     * @ORM\Column(name="latitude", type="float", nullable=true)
     */
    private $latitude;


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
     * Set distance
     *
     * @param float $distance
     * @return Position
     */
    public function setDistance($distance)
    {
        $this->distance = $distance;

        return $this;
    }

    /**
     * Get distance
     *
     * @return float 
     */
    public function getDistance()
    {
        return $this->distance;
    }


    /**
     * Set team
     *
     * @param \Pouce\TeamBundle\Entity\Team $team
     * @return Position
     */
    public function setTeam(\Pouce\TeamBundle\Entity\Team $team)
    {
        $this->team = $team;

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
     * Set edition
     *
     * @param \Pouce\SiteBundle\Entity\Edition $edition
     * @return Position
     */
    public function setEdition(\Pouce\SiteBundle\Entity\Edition $edition)
    {
        $this->edition = $edition;

        return $this;
    }

    /**
     * Get edition
     *
     * @return \Pouce\SiteBundle\Entity\Edition 
     */
    public function getEdition()
    {
        return $this->edition;
    }


    /**
     * Set city
     *
     * @param string $city
     * @return Position
     */
    public function setCity($city)
    {
        $this->city = $city;

        return $this;
    }

    /**
     * Get city
     *
     * @return string 
     */
    public function getCity()
    {
        return $this->city;
    }

    /**
     * Set country
     *
     * @param \Pouce\SiteBundle\Entity\Country $country
     * @return Position
     */
    public function setCountry(\Pouce\SiteBundle\Entity\Country $country)
    {
        $this->country = $country;

        return $this;
    }

    /**
     * Get country
     *
     * @return \Pouce\SiteBundle\Entity\Country 
     */
    public function getCountry()
    {
        return $this->country;
    }

    /**
     * Set longitude
     *
     * @param float $longitude
     * @return Position
     */
    public function setLongitude($longitude)
    {
        $this->longitude = $longitude;

        return $this;
    }

    /**
     * Get longitude
     *
     * @return float 
     */
    public function getLongitude()
    {
        return $this->longitude;
    }

    /**
     * Set latitude
     *
     * @param float $latitude
     * @return Position
     */
    public function setLatitude($latitude)
    {
        $this->latitude = $latitude;

        return $this;
    }

    /**
     * Get latitude
     *
     * @return float 
     */
    public function getLatitude()
    {
        return $this->latitude;
    }
}
